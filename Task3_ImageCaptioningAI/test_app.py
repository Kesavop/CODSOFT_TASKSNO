"""
Comprehensive Test Suite for Image Captioning AI
CodSoft AI Internship - Task 3

Tests:
1. File structure & asset completeness
2. Image header validation & security filters
3. Extension checks & size limit verification
4. Safe upload handling & UUID generation
5. In-memory HTTP Request/Response Testing:
   - GET / (Home page HTML)
   - GET /static/style.css
   - GET /static/script.js
   - GET /api/status
   - POST /api/caption (Invalid format, corrupted bytes, missing body, oversized)
   - POST /api/caption (Valid PNG image)
   - POST /api/caption (Valid JPEG image)
   - GET /404 route
"""

import os
import sys
import io
import json
import zlib
import struct
import unittest
from pathlib import Path

# Ensure task directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

import app


def create_minimal_png(width=10, height=10) -> bytes:
    """Generates a valid minimal uncompressed PNG in pure Python."""
    def chunk(tag, data):
        return (struct.pack('>I', len(data)) +
                tag + data +
                struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    raw_scanlines = b''.join([b'\x00' + (b'\x25\x63\xeb' * width) for _ in range(height)])
    idat = chunk(b'IDAT', zlib.compress(raw_scanlines))
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend


def create_minimal_jpeg() -> bytes:
    """Generates a minimal valid JPEG image in pure Python."""
    return (
        b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00'
        b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08'
        b'\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e'
        b'\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0'
        b'\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00'
        b'\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00'
        b'\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01'
        b'\x01\x00\x00?\x00\xbf\x00\xff\xd9'
    )


def build_multipart_body(field_name, filename, file_bytes, content_type="image/png"):
    """Builds a multipart/form-data byte payload."""
    boundary = "TestBoundary987654321"
    lines = [
        f"--{boundary}".encode('utf-8'),
        f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"'.encode('utf-8'),
        f'Content-Type: {content_type}'.encode('utf-8'),
        b'',
        file_bytes,
        f"--{boundary}--".encode('utf-8'),
        b''
    ]
    body = b'\r\n'.join(lines)
    header = f"multipart/form-data; boundary={boundary}"
    return body, header


class MockSocket:
    """Simulates a TCP socket for in-memory HTTP request/response testing."""
    def __init__(self, raw_input: bytes):
        self.rfile = io.BytesIO(raw_input)
        self.wfile = io.BytesIO()

    def makefile(self, mode, *args, **kwargs):
        if 'r' in mode:
            return self.rfile
        elif 'w' in mode:
            return self.wfile

    def sendall(self, data):
        self.wfile.write(data)


class DummyServer:
    """Mock server container for BaseHTTPRequestHandler."""
    pass


def send_mock_request(method: str, path: str, headers: dict = None, body: bytes = b""):
    """Dispatches a full HTTP request through app.FallbackRequestHandler in memory."""
    if headers is None:
        headers = {}

    req_lines = [f"{method} {path} HTTP/1.1", "Host: localhost"]
    if body and "Content-Length" not in headers:
        headers["Content-Length"] = str(len(body))

    for k, v in headers.items():
        req_lines.append(f"{k}: {v}")

    header_bytes = "\r\n".join(req_lines).encode('utf-8') + b"\r\n\r\n"
    full_request_bytes = header_bytes + body

    sock = MockSocket(full_request_bytes)
    app.FallbackRequestHandler(sock, ('127.0.0.1', 5000), DummyServer())

    raw_response = sock.wfile.getvalue()
    header_part, _, body_part = raw_response.partition(b'\r\n\r\n')

    # Parse status code
    first_line = header_part.split(b'\r\n')[0].decode('latin-1')
    status_code = int(first_line.split(' ')[1])

    return status_code, header_part.decode('latin-1'), body_part


class TestImageCaptioningAI(unittest.TestCase):
    """Test suite covering project files, validation logic, and server responses."""

    @classmethod
    def setUpClass(cls):
        app.load_ai_model()

    def test_01_project_structure(self):
        """Verifies that all required files and templates exist."""
        self.assertTrue((BASE_DIR / "app.py").exists(), "app.py must exist")
        self.assertTrue((BASE_DIR / "requirements.txt").exists(), "requirements.txt must exist")
        self.assertTrue((BASE_DIR / "templates" / "index.html").exists(), "index.html must exist")
        self.assertTrue((BASE_DIR / "static" / "style.css").exists(), "style.css must exist")
        self.assertTrue((BASE_DIR / "static" / "script.js").exists(), "script.js must exist")
        self.assertTrue((BASE_DIR / ".gitignore").exists(), ".gitignore must exist")
        self.assertTrue((BASE_DIR / "uploads").exists(), "uploads directory must exist")

    def test_02_allowed_extensions(self):
        """Verifies extension validation logic."""
        self.assertTrue(app.is_valid_extension("photo.jpg"))
        self.assertTrue(app.is_valid_extension("photo.jpeg"))
        self.assertTrue(app.is_valid_extension("photo.png"))
        self.assertTrue(app.is_valid_extension("UPPERCASE.JPG"))
        self.assertTrue(app.is_valid_extension("IMAGE.PNG"))

        self.assertFalse(app.is_valid_extension("document.pdf"))
        self.assertFalse(app.is_valid_extension("script.py"))
        self.assertFalse(app.is_valid_extension("image.gif"))
        self.assertFalse(app.is_valid_extension("executable.exe"))

    def test_03_image_magic_bytes_validation(self):
        """Verifies image content validation against forged or invalid files."""
        valid_png = create_minimal_png()
        valid_jpeg = create_minimal_jpeg()
        fake_text = b"This is just a text file disguised as image.jpg"
        empty_bytes = b""

        self.assertTrue(app.is_valid_image_bytes(valid_png), "Valid PNG header should pass")
        self.assertTrue(app.is_valid_image_bytes(valid_jpeg), "Valid JPEG header should pass")
        self.assertFalse(app.is_valid_image_bytes(fake_text), "Disguised text file should fail")
        self.assertFalse(app.is_valid_image_bytes(empty_bytes), "Empty bytes should fail")

    def test_04_safe_upload_handling(self):
        """Verifies unique filename generation and safe file writing without path traversal."""
        png_data = create_minimal_png()
        saved_path = app.save_upload_safely(png_data, "../malicious_path/test.png")

        try:
            self.assertTrue(saved_path.exists())
            self.assertEqual(saved_path.suffix, ".png")
            self.assertEqual(saved_path.parent.resolve(), app.UPLOAD_DIR.resolve())
            self.assertEqual(saved_path.read_bytes(), png_data)
        finally:
            if saved_path.exists():
                saved_path.unlink()

    def test_05_http_get_home_page(self):
        """Verifies GET / returns 200 and serves HTML with all required interface elements."""
        status, headers, body = send_mock_request("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers)
        html_str = body.decode('utf-8')
        self.assertIn("Image Captioning AI", html_str)
        self.assertIn("Generate a caption for any image using artificial intelligence.", html_str)
        self.assertIn("Choose Image", html_str)
        self.assertIn("Generate Caption", html_str)
        self.assertIn("previewContainer", html_str)
        self.assertIn("captionBox", html_str)

    def test_06_http_get_static_css(self):
        """Verifies GET /static/style.css returns 200 and valid CSS content."""
        status, headers, body = send_mock_request("GET", "/static/style.css")
        self.assertEqual(status, 200)
        self.assertIn("text/css", headers)
        css_str = body.decode('utf-8')
        self.assertIn(".container", css_str)
        self.assertIn("#2563eb", css_str)

    def test_07_http_get_static_js(self):
        """Verifies GET /static/script.js returns 200 and valid JavaScript."""
        status, headers, body = send_mock_request("GET", "/static/script.js")
        self.assertEqual(status, 200)
        js_str = body.decode('utf-8')
        self.assertIn("handleFileSelection", js_str)
        self.assertIn("handleGenerateCaption", js_str)

    def test_08_http_get_api_status(self):
        """Verifies GET /api/status returns 200 and JSON with model status."""
        status, headers, body = send_mock_request("GET", "/api/status")
        self.assertEqual(status, 200)
        self.assertIn("application/json", headers)
        data = json.loads(body.decode('utf-8'))
        self.assertIn("model_name", data)
        self.assertEqual(data["model_name"], "Salesforce/blip-image-captioning-base")
        self.assertIn("loaded", data)

    def test_09_http_post_caption_invalid_extension(self):
        """Verifies POST /api/caption rejects non-image files with 400 error."""
        body, header = build_multipart_body("image", "document.txt", b"plain text content", "text/plain")
        status, headers, resp_body = send_mock_request("POST", "/api/caption", {"Content-Type": header}, body)
        self.assertEqual(status, 400)
        data = json.loads(resp_body.decode('utf-8'))
        self.assertFalse(data["success"])
        self.assertIn("Invalid file format", data["error"])

    def test_10_http_post_caption_corrupt_file(self):
        """Verifies POST /api/caption rejects files with invalid binary image headers."""
        fake_jpeg = b"This is a disguised text file, not a real JPEG image!"
        body, header = build_multipart_body("image", "fake.jpg", fake_jpeg, "image/jpeg")
        status, headers, resp_body = send_mock_request("POST", "/api/caption", {"Content-Type": header}, body)
        self.assertEqual(status, 400)
        data = json.loads(resp_body.decode('utf-8'))
        self.assertFalse(data["success"])
        self.assertIn("not a valid", data["error"])

    def test_11_http_post_caption_valid_png(self):
        """Verifies POST /api/caption handles valid PNG upload and temporary cleanup."""
        png_bytes = create_minimal_png(width=20, height=20)
        body, header = build_multipart_body("image", "test_photo.png", png_bytes, "image/png")
        status, headers, resp_body = send_mock_request("POST", "/api/caption", {"Content-Type": header}, body)

        # When model is not loaded (torch missing in sandbox), server returns 500 JSON with clear explanation
        # When model is loaded, server returns 200 JSON with caption
        self.assertIn(status, [200, 500])
        data = json.loads(resp_body.decode('utf-8'))
        self.assertIn("success", data)
        if not app.model_state["loaded"]:
            self.assertFalse(data["success"])
            self.assertIn("error", data)
        else:
            self.assertTrue(data["success"])
            self.assertIn("caption", data)

        # Confirm uploads directory contains no leaked temporary files
        remaining_files = [f for f in app.UPLOAD_DIR.iterdir() if f.name != ".gitkeep"]
        self.assertEqual(len(remaining_files), 0, "Temporary uploads must be cleaned up")

    def test_12_http_post_caption_valid_jpeg(self):
        """Verifies POST /api/caption handles valid JPEG upload cleanly."""
        jpeg_bytes = create_minimal_jpeg()
        body, header = build_multipart_body("image", "test_photo.jpg", jpeg_bytes, "image/jpeg")
        status, headers, resp_body = send_mock_request("POST", "/api/caption", {"Content-Type": header}, body)

        self.assertIn(status, [200, 500])
        data = json.loads(resp_body.decode('utf-8'))
        self.assertIn("success", data)

        # Confirm uploads directory is clean
        remaining_files = [f for f in app.UPLOAD_DIR.iterdir() if f.name != ".gitkeep"]
        self.assertEqual(len(remaining_files), 0, "Temporary uploads must be cleaned up")

    def test_13_http_get_404(self):
        """Verifies non-existent endpoints return 404."""
        status, headers, body = send_mock_request("GET", "/some_unknown_path")
        self.assertEqual(status, 404)

    def test_14_http_post_caption_oversized_file(self):
        """Verifies POST /api/caption rejects oversized files (>10MB)."""
        oversized_bytes = b"0" * (app.MAX_FILE_SIZE + 1024)
        body, header = build_multipart_body("image", "huge.jpg", oversized_bytes, "image/jpeg")
        status, headers, resp_body = send_mock_request("POST", "/api/caption", {"Content-Type": header}, body)
        self.assertEqual(status, 400)
        data = json.loads(resp_body.decode('utf-8'))
        self.assertFalse(data["success"])
        self.assertIn("exceeds", data["error"].lower())

    def test_15_http_post_caption_missing_body(self):
        """Verifies POST /api/caption handles empty or malformed requests."""
        status, headers, resp_body = send_mock_request("POST", "/api/caption", {}, b"")
        self.assertEqual(status, 400)
        data = json.loads(resp_body.decode('utf-8'))
        self.assertFalse(data["success"])


if __name__ == "__main__":
    unittest.main()
