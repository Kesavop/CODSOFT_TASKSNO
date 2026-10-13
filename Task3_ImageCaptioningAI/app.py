"""
Image Captioning AI - Web Application
CodSoft Artificial Intelligence Internship - Task 3

This application accepts an uploaded image (JPG, JPEG, PNG) and generates
a natural-language descriptive caption using the pretrained Salesforce BLIP
model (Salesforce/blip-image-captioning-base) via Hugging Face Transformers.

Architecture:
- Backend: Python + Flask (with built-in HTTP server fallback)
- AI Model: Salesforce/blip-image-captioning-base (Vision Transformer + BERT decoder)
- Frontend: HTML5, CSS3 (Light theme, light blue accents), Vanilla JavaScript
"""

import os
import sys
import uuid
import json
import logging
from pathlib import Path

# ==============================================================================
# 1. LOGGING & BASIC CONFIGURATION
# ==============================================================================
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("ImageCaptioningAI")

# Directory setup
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

UPLOAD_DIR.mkdir(exist_ok=True)

# Upload validation constraints
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 Megabytes limit

# ==============================================================================
# 2. PRETRAINED AI MODEL INITIALIZATION (LOAD ONCE)
# ==============================================================================
# We load the model once into global memory rather than reloading on each request.
MODEL_NAME = "Salesforce/blip-image-captioning-base"

blip_model = None
blip_processor = None
compute_device = "cpu"

model_state = {
    "loaded": False,
    "model_name": MODEL_NAME,
    "device": compute_device,
    "error": None
}

def load_ai_model():
    """
    Initializes the pretrained Hugging Face Transformers BLIP model.
    Loads model weights once on startup to ensure fast inference for user requests.
    Supports CUDA (NVIDIA GPU), Apple Silicon MPS, or standard CPU.
    """
    global blip_model, blip_processor, compute_device, model_state

    logger.info("Initializing pretrained captioning model: %s", MODEL_NAME)

    try:
        import torch
        from transformers import BlipProcessor, BlipForConditionalGeneration
        from PIL import Image

        # Device selection: GPU > Apple Silicon MPS > CPU
        if torch.cuda.is_available():
            compute_device = "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            compute_device = "mps"
        else:
            compute_device = "cpu"

        logger.info("Using compute device: %s", compute_device)
        logger.info("Loading processor and model weights from Hugging Face...")

        blip_processor = BlipProcessor.from_pretrained(MODEL_NAME)
        blip_model = BlipForConditionalGeneration.from_pretrained(MODEL_NAME).to(compute_device)
        blip_model.eval()  # Set model to evaluation mode

        model_state["loaded"] = True
        model_state["device"] = compute_device
        model_state["error"] = None
        logger.info("Pretrained BLIP captioning model successfully loaded and ready.")
        return True

    except ImportError as ie:
        missing_pkg = str(ie)
        err_msg = (
            f"Required AI dependencies are not installed ({missing_pkg}). "
            "Please run: pip install -r requirements.txt"
        )
        logger.warning(err_msg)
        model_state["loaded"] = False
        model_state["error"] = err_msg
        return False

    except Exception as ex:
        err_msg = f"Failed to load pretrained weights for '{MODEL_NAME}': {str(ex)}"
        logger.error(err_msg)
        model_state["loaded"] = False
        model_state["error"] = err_msg
        return False


def run_caption_inference(image_path: Path) -> dict:
    """
    Takes an image file path and generates a descriptive caption.
    Performs preprocessing, tensor generation, beam-search decoding,
    and returns the final natural-language description.
    """
    if not model_state["loaded"] or blip_model is None or blip_processor is None:
        return {
            "success": False,
            "error": model_state.get("error") or "AI Model is not loaded. Please install dependencies.",
            "caption": None
        }

    try:
        import torch
        from PIL import Image

        # Open and ensure standard RGB color format
        with Image.open(image_path) as raw_img:
            rgb_image = raw_img.convert("RGB")

            # Preprocess image into normalized PyTorch tensors
            inputs = blip_processor(images=rgb_image, return_tensors="pt").to(compute_device)

            # Generate caption tokens using beam search
            with torch.no_grad():
                output_tokens = blip_model.generate(
                    **inputs,
                    max_new_tokens=50,
                    num_beams=3,
                    early_stopping=True
                )

            # Decode token sequence into readable English text
            raw_caption = blip_processor.decode(output_tokens[0], skip_special_tokens=True).strip()

            # Clean and format caption
            if raw_caption:
                caption = raw_caption[0].upper() + raw_caption[1:]
                if not caption.endswith('.'):
                    caption += '.'
            else:
                caption = "Could not generate a descriptive caption for this image."

            return {
                "success": True,
                "caption": caption,
                "model": MODEL_NAME,
                "device": compute_device
            }

    except Exception as e:
        logger.exception("Error during caption generation: %s", e)
        return {
            "success": False,
            "error": f"Model inference error: {str(e)}",
            "caption": None
        }


# ==============================================================================
# 3. FILE VALIDATION & SAFETY HELPERS
# ==============================================================================
def is_valid_extension(filename: str) -> bool:
    """Validates if the uploaded file has an allowed image extension."""
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def is_valid_image_bytes(file_bytes: bytes) -> bool:
    """
    Verifies that the uploaded bytes match valid image headers (JPEG, PNG).
    Prevents disguised executable or malicious file uploads.
    """
    if len(file_bytes) < 8:
        return False

    # JPEG magic bytes: FF D8 FF
    if file_bytes.startswith(b'\xff\xd8\xff'):
        return True

    # PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if file_bytes.startswith(b'\x89PNG\r\n\x1a\n'):
        return True

    return False


def save_upload_safely(file_bytes: bytes, original_filename: str) -> Path:
    """
    Saves an uploaded image with a cryptographically unique UUID filename
    to avoid file collisions and path traversal risks.
    """
    ext = os.path.splitext(original_filename)[1].lower()
    if not ext:
        ext = ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = UPLOAD_DIR / unique_name
    dest_path.write_bytes(file_bytes)
    return dest_path


# ==============================================================================
# 4. FLASK APPLICATION (PRIMARY IMPLEMENTATION)
# ==============================================================================
try:
    from flask import Flask, request, jsonify, render_template, send_from_directory
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False


def create_flask_app():
    """Builds and returns the configured Flask web application."""
    app = Flask(
        __name__,
        template_folder=str(TEMPLATES_DIR),
        static_folder=str(STATIC_DIR)
    )
    app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/api/status', methods=['GET'])
    def get_status():
        return jsonify(model_state)

    @app.route('/api/caption', methods=['POST'])
    def process_caption():
        if 'image' not in request.files:
            return jsonify({"success": False, "error": "No image file provided in request."}), 400

        uploaded_file = request.files['image']
        if not uploaded_file or uploaded_file.filename == '':
            return jsonify({"success": False, "error": "No image selected."}), 400

        filename = uploaded_file.filename
        if not is_valid_extension(filename):
            return jsonify({
                "success": False,
                "error": f"Invalid file format '{filename}'. Allowed: JPG, JPEG, PNG."
            }), 400

        file_bytes = uploaded_file.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            return jsonify({
                "success": False,
                "error": f"Image exceeds maximum size limit of {MAX_FILE_SIZE // (1024 * 1024)}MB."
            }), 400

        if not is_valid_image_bytes(file_bytes):
            return jsonify({
                "success": False,
                "error": "The uploaded file does not appear to be a valid JPG or PNG image."
            }), 400

        # Save safely with unique UUID
        saved_path = save_upload_safely(file_bytes, filename)

        try:
            result = run_caption_inference(saved_path)
            status_code = 200 if result.get("success") else 500
            return jsonify(result), status_code
        finally:
            # Clean up uploaded file after inference to conserve disk space
            try:
                if saved_path.exists():
                    saved_path.unlink()
            except Exception as e:
                logger.warning("Could not delete temporary upload file %s: %s", saved_path, e)

    @app.errorhandler(413)
    def file_too_large(error):
        return jsonify({
            "success": False,
            "error": "Uploaded file is too large. Maximum allowed size is 10MB."
        }), 413

    return app


# ==============================================================================
# 5. STANDALONE HTTP SERVER FALLBACK
# ==============================================================================
# If Flask is not yet installed in the user's environment, this fallback
# runs using Python's standard library so the web application and frontend
# remain immediately testable and functional out of the box.
from http.server import HTTPServer, BaseHTTPRequestHandler
import mimetypes

class FallbackRequestHandler(BaseHTTPRequestHandler):
    """Handles HTTP requests using Python standard library."""

    def log_message(self, format, *args):
        logger.info("%s - - %s", self.address_string(), format % args)

    def do_GET(self):
        url_path = self.path.split('?')[0]

        if url_path == '/' or url_path == '/index.html':
            self.serve_file(TEMPLATES_DIR / 'index.html', 'text/html; charset=utf-8')
        elif url_path == '/api/status':
            self.send_json(model_state, 200)
        elif url_path.startswith('/static/'):
            rel_path = url_path[len('/static/'):]
            target_file = STATIC_DIR / rel_path
            mime, _ = mimetypes.guess_type(str(target_file))
            self.serve_file(target_file, mime or 'application/octet-stream')
        else:
            self.send_error(404, "File Not Found")

    def do_POST(self):
        url_path = self.path.split('?')[0]

        if url_path == '/api/caption':
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length <= 0:
                self.send_json({"success": False, "error": "No file uploaded."}, 400)
                return

            if content_length > MAX_FILE_SIZE:
                self.send_json({"success": False, "error": "File size exceeds 10MB limit."}, 400)
                return

            body = self.rfile.read(content_length)
            content_type = self.headers.get('Content-Type', '')

            # Parse multipart boundary
            if 'boundary=' not in content_type:
                self.send_json({"success": False, "error": "Invalid Content-Type header."}, 400)
                return

            boundary = content_type.split('boundary=')[1].strip().encode('utf-8')
            parts = body.split(b'--' + boundary)

            file_bytes = None
            filename = "upload.jpg"

            for part in parts:
                if b'filename="' in part:
                    header_part, _, file_data = part.partition(b'\r\n\r\n')
                    if file_data.endswith(b'\r\n'):
                        file_data = file_data[:-2]

                    # Extract original filename
                    try:
                        header_str = header_part.decode('latin-1')
                        for line in header_str.split('\r\n'):
                            if 'filename="' in line:
                                filename = line.split('filename="')[1].split('"')[0]
                    except Exception:
                        filename = "image.jpg"

                    file_bytes = file_data
                    break

            if not file_bytes:
                self.send_json({"success": False, "error": "Could not extract image from upload."}, 400)
                return

            if not is_valid_extension(filename):
                self.send_json({
                    "success": False,
                    "error": f"Invalid file format '{filename}'. Allowed: JPG, JPEG, PNG."
                }, 400)
                return

            if not is_valid_image_bytes(file_bytes):
                self.send_json({
                    "success": False,
                    "error": "The uploaded file is not a valid JPG or PNG image."
                }, 400)
                return

            saved_path = save_upload_safely(file_bytes, filename)
            try:
                result = run_caption_inference(saved_path)
                status_code = 200 if result.get("success") else 500
                self.send_json(result, status_code)
            finally:
                if saved_path.exists():
                    saved_path.unlink()
        else:
            self.send_error(404, "Endpoint Not Found")

    def serve_file(self, file_path: Path, mime_type: str):
        if not file_path.exists() or not file_path.is_file():
            self.send_error(404, "File Not Found")
            return

        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', mime_type)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, data: dict, status_code: int = 200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


# ==============================================================================
# 6. APPLICATION ENTRY POINT
# ==============================================================================
def main():
    host = "127.0.0.1"
    port = int(os.environ.get("PORT", 5000))

    # Initialize model once at startup
    load_ai_model()

    print("=" * 65)
    print("      IMAGE CAPTIONING AI - CODSOFT TASK 3")
    print("=" * 65)
    print(f" * Model: {MODEL_NAME}")
    print(f" * Model Status: {'Ready' if model_state['loaded'] else 'Dependencies Pending'}")
    print(f" * Local URL: http://{host}:{port}/")
    print("=" * 65)

    if FLASK_AVAILABLE:
        logger.info("Running with Flask web server on http://%s:%d", host, port)
        app = create_flask_app()
        app.run(host=host, port=port, debug=False)
    else:
        logger.warning(
            "Flask is not installed in this environment. Running built-in "
            "Python HTTP server fallback. Run 'pip install -r requirements.txt' "
            "to install Flask and full AI libraries."
        )
        server = HTTPServer((host, port), FallbackRequestHandler)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            logger.info("Server shutting down.")
            server.server_close()


if __name__ == "__main__":
    main()
