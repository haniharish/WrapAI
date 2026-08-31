# WrapAI — Python AI Service (Speech-to-Text, Diarization, LLM Analysis & RAG)

The **WrapAI AI Service** is a dedicated FastAPI microservice responsible for media preprocessing, FFmpeg audio extraction/normalization, high-performance speech-to-text transcription powered by **Faster-Whisper** (CTranslate2), speaker diarization powered by **pyannote.audio**, LLM content intelligence (Gemini / OpenAI), and **Retrieval-Augmented Generation (RAG)** semantic vector search.

---

## 🚀 Key Features
- **FastAPI Async Engine**: Clean REST endpoints with Pydantic validation.
- **Faster-Whisper (CTranslate2)**: Up to 4x faster transcription than standard Whisper with 50% less RAM/VRAM usage.
- **pyannote.audio Diarization**: Multi-speaker turn detection and acoustic segmentation (`SPEAKER_00`, `SPEAKER_01`...).
- **Temporal Alignment Engine**: Mathematical overlap algorithm matching transcript segments with speaker turns.
- **LLM Content Intelligence**: Generates executive summaries, key takeaways, topics, decisions, action items, questions, and highlights.
- **Semantic Vector Embeddings**: Pluggable embedding providers (Google Gemini `text-embedding-004`, OpenAI `text-embedding-3-small`, and deterministic offline heuristic).
- **RAG Grounded Q&A**: Answers natural-language user queries with verified speaker citations and precise audio/video timestamps.
- **Prompt Injection Defense**: Strict isolation of untrusted transcript context from system directives.
- **Internal Security**: Authenticated via `X-Internal-API-Key` header.
- **Automatic Cleanup**: Temporary directories and streaming files are wiped immediately on completion or failure.

---

## 🛠️ Setup & Installation

### Local Virtual Environment
```bash
cd ai-service
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

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
| `LLM_PROVIDER` | `gemini` | LLM Provider (`gemini`, `openai`, `heuristic`) |
| `LLM_MODEL` | `gemini-2.5-flash`| LLM Model name |
| `EMBEDDING_PROVIDER` | `gemini` | Embedding Provider (`gemini`, `openai`, `heuristic`) |
| `EMBEDDING_MODEL` | `text-embedding-004` | Embedding Model name |
| `EMBEDDING_DIMENSIONS` | `768` | Vector dimensions (must match MongoDB Atlas index) |
| `WHISPER_MODEL_SIZE` | `small` | Faster-Whisper model (`tiny`, `base`, `small`, `medium`, `large-v3`) |
| `WHISPER_DEVICE` | `cpu` | Inference device (`cpu` or `cuda`) |
| `WHISPER_COMPUTE_TYPE` | `int8` | Precision (`int8` for CPU, `float16` for CUDA) |
| `WHISPER_VAD_FILTER` | `true` | Enable Voice Activity Detection filter to eliminate silence |
| `HF_TOKEN` | `None` | Hugging Face user access token for gated pyannote models |
| `DIARIZATION_MODEL` | `pyannote/speaker-diarization-3.1` | Diarization pipeline model name |
| `DIARIZATION_DEVICE` | `cpu` | Diarization inference device (`cpu` or `cuda`) |
| `MAX_FILE_SIZE_BYTES`| `524288000` | 500 MB maximum media file size |

---

## 📡 API Endpoints
- `GET /health` — Public health and configuration status.
- `POST /internal/v1/transcribe` — Combined transcription, speaker diarization, and alignment endpoint.
- `POST /internal/v1/diarize` — Standalone speaker diarization endpoint.
- `POST /internal/v1/analyze` — LLM structured analysis (summaries, topics, decisions, action items).
- `POST /internal/v1/embeddings/generate` — Batch vector embedding generation.
- `POST /internal/v1/rag/answer` — Grounded RAG Q&A synthesis with speaker & timestamp citations.
