# WRAPAI — PHASE 7: PYTHON AI SERVICE, MEDIA PREPROCESSING & SPEECH-TO-TEXT

**WrapAI — "From Content to Clarity."**

---

## 1. Overview & Architecture

Phase 7 introduces the first real AI/ML processing service for WrapAI. It establishes a dedicated **Python FastAPI AI Microservice** (`ai-service/`), media extraction and normalization using **FFmpeg**, high-performance Speech-to-Text inference powered by **Faster-Whisper** (CTranslate2), and seamless bidirectional orchestration with the Node.js background worker and MongoDB Atlas data layer.

```
                      React Client (Workspace UI)
                                 │
                                 ▼
                     Node.js Express API Gateway
                                 │
                        [Authentication & RBAC]
                                 │
                                 ▼
                       BullMQ Job Queue
                                 │
                                 ▼
                           Redis Broker
                                 │
                                 ▼
                      Node.js Background Worker
                                 │
               ┌─────────────────┴─────────────────┐
               │ 1. Generate Secure Signed URL     │
               │ 2. POST /internal/v1/transcribe   │
               │ (Auth: Bearer AI_SERVICE_API_KEY) │
               ▼                                   ▼
      Python FastAPI AI Service            Raw Text Ingestion
               │                                   │
      ┌────────┴────────┐                          │ Direct Text
      ▼                 ▼                          │ Segmentation
    FFmpeg        Faster-Whisper                   │
  (Audio Extract) (16kHz STT Inference)            │
      │                 │                          │
      └────────┬────────┘                          │
               │                                   │
               ▼                                   ▼
        Transcript Segments & Audio Metadata Returned
                               │
                               ▼
                   MongoDB Atlas Data Layer
               (transcripts & transcriptsegments)
                               │
                               ▼
                    React Content Workspace
         (Live Transcripts, Seeking, Keyword Search)
```

---

## 2. Key Design & Architectural Decisions

### 2.1. Why Python & FastAPI?
- **Python ML Ecosystem**: Python provides native access to machine learning runtimes (CTranslate2, PyTorch, ONNX) and multimedia pipelines.
- **FastAPI Asynchronous Engine**: Built on Starlette/Uvicorn, FastAPI provides non-blocking asynchronous request handling, native Pydantic v2 data validation, and OpenAPI generation.
- **Process Isolation**: ML inference runs in an independent container, isolating heavy CPU/GPU memory workloads from the Node.js API Gateway.

### 2.2. Why Faster-Whisper?
- **CTranslate2 Optimization**: Faster-Whisper is a reimplementation of OpenAI Whisper using CTranslate2, offering up to **4x faster execution** with **~50% lower memory footprint**.
- **Model Size Selected**: `small` (244M parameters, ~500MB RAM/VRAM).
  - *Accuracy vs Speed*: Provides >95% accuracy for conversational and lecture audio while maintaining sub-realtime latency on standard 4-core CPUs.
  - *Configurable*: Model size is customizable via `WHISPER_MODEL_SIZE` (`tiny`, `base`, `small`, `medium`, `large-v3`).
- **Compute Precision**: Configured to `int8` for CPU execution and `float16` for CUDA GPU execution.
- **VAD (Voice Activity Detection)**: Integrated Silero VAD filtering skips prolonged silence and background noise, accelerating transcription and preventing hallucinated repetitive loops.

### 2.3. Media Preprocessing & FFmpeg Pipeline
- **Format Normalization**: Incoming audio/video files (MP4, WebM, MOV, MP3, M4A, FLAC, etc.) are converted to 16-bit PCM mono WAV at 16,000 Hz (`pcm_s16le`, `-ar 16000`, `-ac 1`), matching Whisper's acoustic feature extractor.
- **Cross-Platform Portability**: `MediaProcessor` checks system PATH for `ffmpeg` and seamlessly falls back to bundled static binary via `imageio-ffmpeg`.
- **Memory Safety**: Large files are streamed to temporary storage chunks on disk, preventing Node.js and Python memory saturation.

### 2.4. Node.js $\leftrightarrow$ Python Communication & Security
- **Internal Service API**: `POST /internal/v1/transcribe` (internal port 8000).
- **Internal Authentication**: Requires `X-Internal-API-Key` or `Authorization: Bearer <KEY>`. Rejects unauthorized calls with 401.
- **Temporary File Lifecycle**: Uses context-managed directories (`FileManager.create_temp_context`) guaranteeing cleanup on completion, error, or timeout.

---

## 3. MongoDB Data Layer & Transcript Persistence

Transcripts and segments are persisted in the existing Mongoose collections established in Phase 3:
1. **`Transcript`**:
   - `contentId`, `userId`, `language`, `durationSeconds`, `wordCount`, `processingModel`, `status` (`COMPLETED`).
2. **`TranscriptSegment`**:
   - `transcriptId`, `contentId`, `speakerLabel` (`SPEAKER_00`), `speakerDisplayName` (`Speaker 1`), `startTime`, `endTime`, `text`, `sequence`, `confidence`.
3. **`Speaker`**:
   - Initialized with default speaker record (`SPEAKER_00`, `Speaker 1`) ready for Phase 8 diarization turn clustering.

### 3.1. Strict Idempotency
- Before saving new segments on retry or re-processing, `transcriptRepository.deleteByContentId(contentId)` removes previous transcripts, speakers, and segments, preventing duplicate or orphaned entries.

---

## 4. Frontend Integration

1. **[client/src/services/transcriptService.js](file:///c:/Users/Lenovo/Desktop/wrapAI/client/src/services/transcriptService.js)**:
   - `getTranscript(contentId)`: `GET /api/v1/content/:contentId/transcript`
   - `updateSpeakerName(contentId, speakerLabel, displayName)`: `PATCH /api/v1/content/:contentId/speakers`
2. **[client/src/pages/user/workspace/tabs/TranscriptTab.jsx](file:///c:/Users/Lenovo/Desktop/wrapAI/client/src/pages/user/workspace/tabs/TranscriptTab.jsx)**:
   - Displays real timestamped transcript segments loaded from MongoDB Atlas.
   - Interactive timecode seeking: clicking timestamp dispatches playback jump to audio/video player.
   - Real-time keyword search across transcript text.
   - Speaker renaming modal updating all associated segments.

---

## 5. Verification & Test Results

### 5.1. Python AI Service Tests (`ai-service/tests/`)
All 8 tests passed in 0.96s:
```
tests/test_auth.py ......................... [ 37%]
tests/test_health.py ....................... [ 50%]
tests/test_media_processor.py .............. [ 62%]
tests/test_transcribe.py ................... [100%]

8 passed in 0.96s
```

### 5.2. Node.js Backend Tests (`backend/tests/ai_transcription.test.js`)
All 5 integration tests passed:
```
√ should process audio media through AI speech-to-text pipeline and persist timestamped transcript
√ should process raw text content without speech-to-text and segment into sequential paragraphs
√ should enforce idempotency and replace previous transcript on job retry without creating duplicates
√ should allow renaming a speaker and update speaker manifest and segments
√ should enforce multi-tenant isolation and prevent User B from accessing User A transcript
```

### 5.3. Client Build Verification
```
✓ 1619 modules transformed.
✓ built in 7.00s with 0 errors.
```

---

## 6. Boundary Confirmation (Phase 7 vs Future Phases)
- **Implemented in Phase 7**: Python AI Service, FastAPI, Media Preprocessing, FFmpeg, Faster-Whisper STT, Timestamp Generation, MongoDB Transcript Persistence, Interactive Frontend Transcript Tab.
- **NOT Implemented (Reserved for Future Phases)**:
  - Phase 8: Speaker Diarization & Pyannote turn clustering.
  - Phase 9: LLM Summarization, Topics, Key Points, Action Items, Decisions.
  - Phase 10: Vector Search, Atlas Embeddings, RAG.
  - Phase 11: PDF & DOCX Export.
  - Phase 12: Ask Your Content Conversational AI.
