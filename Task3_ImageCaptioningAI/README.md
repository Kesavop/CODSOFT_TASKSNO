# Image Captioning AI

**CodSoft Artificial Intelligence Internship — Task 3**
**Repository:** `CODSOFT_TASKSNO`

An intelligent web application that accepts user-uploaded images and automatically generates descriptive, natural-language captions using a pretrained deep learning Vision-Language model (**Salesforce BLIP**).

---

## 📌 Project Overview

This project was developed for **Task 3 of the CodSoft Artificial Intelligence Internship**. The objective is to build a practical, functional web application that demonstrates multimodal deep learning by converting visual information into coherent English sentences.

The user interface follows a clean, student-built design:
- **Clean light theme** with pure white card backgrounds and light blue accents (`#2563eb`, `#eff6ff`).
- **Single-page layout** containing the image picker, instant image preview, caption trigger, loading state, and result display card.
- **No unnecessary animations or SaaS marketing fluff** — built with clear HTML5, CSS3, vanilla JavaScript, Flask, and Hugging Face Transformers.

---

## 🌟 Key Features

1. **Single-Page Centered Layout**: Clean and responsive on desktop monitors, laptops, and mobile screens.
2. **Instant Image Preview**: Previews the selected image locally before sending it to the server using the HTML5 `FileReader` API.
3. **Multi-Format Support**: Accepts `.jpg`, `.jpeg`, and `.png` images.
4. **Strict Dual-Layer Validation**:
   - **Frontend validation**: Checks file extensions and enforces a 10 MB maximum file size limit.
   - **Backend validation**: Verifies magic bytes (`0xFFD8FF` for JPEG, `0x89504E47` for PNG) and checks file size before processing.
5. **Pretrained AI Model (Loaded Once)**:
   - Utilizes `Salesforce/blip-image-captioning-base` via Hugging Face `transformers`.
   - The model and tokenizer/processor are initialized **once on application startup** and kept in memory to eliminate per-request reloading latency.
   - Automatically utilizes Apple Silicon **MPS** or NVIDIA **CUDA** if available, falling back smoothly to **CPU**.
6. **Graceful Error Handling & Transparency**:
   - Displays clear error alerts if an unsupported file is provided.
   - If AI dependencies or weights are not yet downloaded in the environment, the server reports the exact missing dependency instead of faking outputs or crashing.
7. **Copy to Clipboard**: One-click button to copy the generated caption text.
8. **Automated Unit & Integration Test Suite**: Includes 15 automated test cases in `test_app.py` covering file structure, headers, security validation, and API routes.

---

## 🧠 How the AI Captioning Model Works

The application uses **BLIP (Bootstrapping Language-Image Pre-training)** developed by Salesforce Research (`Salesforce/blip-image-captioning-base`).

```
+------------------+       +-------------------------+
|  Uploaded Image  | ----> | Visual Transformer ViT  | ----+
|   (RGB Tensor)   |       | (Patch Embedding Grid)  |     |
+------------------+       +-------------------------+     |
                                                           | Cross-Attention
                                                           v
+------------------+       +-------------------------+     |
| Auto-regressive  | <---- | Text Decoder (BERT-like)| <---+
| Token Generation |       | (Generates Word Tokens) |
+------------------+       +-------------------------+
         |
         v
"A dog running across a grassy field."
```

### 1. Vision Transformer (ViT) Encoder
The input image is resized and normalized into fixed-size patches (e.g., $16 \times 16$ pixels), which are flattened and projected into a sequence of linear embeddings. A Vision Transformer processes these visual tokens to extract rich semantic representations of objects, textures, and spatial arrangements.

### 2. Multimodal Cross-Attention Decoder
The text decoder uses a BERT-based architecture modified with cross-attention layers. At each decoding step, the decoder attends to the visual representations produced by the ViT encoder to predict the next most probable English word token.

### 3. Beam Search Generation
Rather than simple greedy token sampling, the model applies **Beam Search** ($k=3$) to evaluate multiple candidate sentence trajectories, producing grammatically accurate, natural sentences that describe the primary subject and context of the image.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | Python 3 | Core logic, validation, and AI pipeline |
| **Web Server** | Flask 3.0+ | Lightweight REST API and static template routing |
| **AI Framework** | PyTorch (`torch`) | Tensor computation and neural network execution |
| **NLP & Vision** | Hugging Face `transformers` | Model loading and inference (`BlipProcessor`, `BlipForConditionalGeneration`) |
| **Image Processing** | Pillow (`PIL`) | Image decoding, format normalization (RGB), and verification |
| **Frontend UI** | HTML5, CSS3, Vanilla JS | Student-built light theme with light blue accents |

---

## 📁 Project Structure

```
Task3_ImageCaptioningAI/
├── app.py                  # Main backend application (Flask + BLIP Pipeline + fallback server)
├── requirements.txt        # Python dependency manifest
├── README.md               # Detailed project documentation and setup guide
├── .gitignore              # Ignores venv, __pycache__, upload images, and cache files
├── templates/
│   └── index.html          # Single-page clean HTML5 user interface
├── static/
│   ├── style.css           # Clean CSS stylesheet (light theme, light blue accents)
│   └── script.js           # Frontend logic (file picking, preview, fetch API, copy)
├── sample_images/          # Sample images for testing the captioning pipeline
│   ├── sample_preview.png
│   └── sample_photo.jpg
├── uploads/                # Ephemeral storage directory for temporary file processing
│   └── .gitkeep            # Preserves directory in git repository
└── test_app.py             # 15 automated unit & integration test cases
```

---

## 🚀 Setup & Installation Instructions

Follow these steps to run the project on your local machine:

### 1. Clone or Open the Repository
```bash
git clone https://github.com/<your-username>/CODSOFT_TASKSNO.git
cd CODSOFT_TASKSNO/Task3_ImageCaptioningAI
```

### 2. Create and Activate a Python Virtual Environment

**On macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows (PowerShell / Command Prompt):**
```powershell
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

> **Note**: When running for the very first time with an active internet connection, Hugging Face Transformers will download the pretrained model weights (~990 MB) for `Salesforce/blip-image-captioning-base`. Subsequent launches will load directly from the local cache.

---

## 💻 Running the Web Application

Start the application by running:
```bash
python app.py
```

You will see output similar to:
```
=================================================================
      IMAGE CAPTIONING AI - CODSOFT TASK 3
=================================================================
 * Model: Salesforce/blip-image-captioning-base
 * Model Status: Ready
 * Local URL: http://127.0.0.1:5000/
=================================================================
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🧪 Testing the Application

### Running Automated Tests
The project includes a comprehensive test suite in `test_app.py`. Run it directly with:
```bash
python test_app.py
```
**Test Coverage (15 Tests):**
- Project file structure & template completeness.
- Allowed extensions validation (`.jpg`, `.jpeg`, `.png`, mixed-case).
- Binary magic byte validation (rejection of forged text files).
- Safe file naming & path traversal protection.
- In-memory HTTP endpoint tests (`GET /`, `GET /static/*`, `GET /api/status`).
- File validation rejection (`POST /api/caption` with invalid extensions, corrupt bytes, oversized bodies).
- Clean temporary upload deletion after inference.

---

## 📸 Example User Interface & Progression

```
------------------------------------------------
             Image Captioning AI

  Generate a caption for any image using AI.

             [ Choose Image ]   sunset.jpg (1.2 MB)

    +------------------------------------------+
    |                                          |
    |               [ Image Preview ]          |
    |                                          |
    +------------------------------------------+

             [ Generate Caption ]

------------------------------------------------
  Generated Caption

  "A colorful sunset over the ocean with gentle waves."
------------------------------------------------
```

---

## 📤 Git Commands to Upload to GitHub

To submit this project to your CodSoft internship GitHub repository (`CODSOFT_TASKSNO`):

```bash
# 1. Initialize git in the root of your repository (if not already done)
git init

# 2. Add files to staging
git add Task3_ImageCaptioningAI/

# 3. Create your commit
git commit -m "Complete Task 3: Image Captioning AI web application with Salesforce BLIP"

# 4. Set branch to main
git branch -M main

# 5. Link to your remote GitHub repository
git remote add origin https://github.com/<your-username>/CODSOFT_TASKSNO.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 📄 License & Attribution

Developed as part of the **CodSoft Artificial Intelligence Internship Program (Task 3)**.
Pretrained model weights provided by **Salesforce Research** via **Hugging Face Hub**.
