# WrapAI — Python AI Service (Speech-to-Text & Media Processing)

The **WrapAI AI Service** is a dedicated FastAPI microservice responsible for media preprocessing, FFmpeg audio extraction/normalization, and high-performance speech-to-text transcription powered by **Faster-Whisper** (CTranslate2).

---

## 🚀 Key Features
- **FastAPI Async Engine**: Clean REST endpoints with Pydantic validation.
- **Faster-Whisper (CTranslate2)**: Up to 4x faster transcription than standard Whisper with 50% less RAM/VRAM usage.
- **Automatic Audio Normalization**: Converts incoming audio/video media into 16kHz single-channel mono PCM WAV format for optimal Whisper acoustic modeling.
- **Timestamped Segments**: Generates precision start and end timestamps (`startTime`, `endTime`, `text`, `sequence`).
- **Internal Security**: Authenticated via `X-Internal-API-Key` or Bearer token header.
- **Automatic Cleanup**: Temporary directories and streaming files are wiped immediately on completion or failure.

---

## 🛠️ Setup & Installation

### Local Virtual Environment
```bash
cd ai-service
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### Running Locally
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Running Tests
```bash
pytest tests/
```

---

## ⚙️ Environment Variables
| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | Microservice port |
| `AI_SERVICE_API_KEY` | `...` | Secret key for internal Node.js communication |
| `WHISPER_MODEL_SIZE` | `small` | Faster-Whisper model (`tiny`, `base`, `small`, `medium`, `large-v3`) |
| `WHISPER_DEVICE` | `cpu` | Inference device (`cpu` or `cuda`) |
| `WHISPER_COMPUTE_TYPE` | `int8` | Precision (`int8` for CPU, `float16` for CUDA) |
| `WHISPER_VAD_FILTER` | `true` | Enable Voice Activity Detection filter to eliminate silence |
| `MAX_FILE_SIZE_BYTES`| `524288000` | 500 MB maximum media file size |

---

## 📡 API Endpoints
- `GET /health` — Public health and configuration status.
- `POST /internal/v1/transcribe` — Authenticated transcription endpoint (requires `X-Internal-API-Key`).
