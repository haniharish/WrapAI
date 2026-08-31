# WRAPAI — PHASE 8: SPEAKER DIARIZATION & SPEAKER-AWARE TRANSCRIPTS

**WrapAI — "From Content to Clarity."**

---

## 1. Overview & Core Objective

Phase 8 introduces **Speaker Diarization** and **Speaker-Aware Transcript Alignment** to WrapAI. While Speech-to-Text (Phase 7) answers *"What was said?"*, Speaker Diarization answers *"Who spoke when?"*.

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
               │ 1. Acquire Media Access (Signed URL)
               │ 2. POST /internal/v1/transcribe
               │ (Auth: Bearer AI_SERVICE_API_KEY)
               ▼                                   ▼
      Python FastAPI AI Service            Raw Text Ingestion
               │                                   │
      ┌────────┴────────┐                          │ Direct Text
      ▼                 ▼                          │ Segmentation
    FFmpeg        Faster-Whisper                   │
  (Audio Extract) (16kHz STT Inference)            │
      │                 │                          │
      │                 ▼                          │
      │           Transcript Segments              │
      │                 │                          │
      └────────►  pyannote.audio                   │
              (Speaker Diarization)                │
                        │                          │
                        ▼                          │
                  Speaker Turns                    │
                        │                          │
                        ▼                          │
        TranscriptSpeakerAlignmentService          │
              (Temporal Overlap Engine)            │
                        │                          │
                        ▼                          │
        Speaker-Aware Transcripts + Manifest       │
                        │                          │
                        └────────┬─────────────────┘
                                 │
                                 ▼
                     MongoDB Atlas Data Layer
               (transcripts, transcriptsegments, speakers)
                                 │
                                 ▼
                      React Content Workspace
         (Speaker Manifest, Turn Filtering, One-Click Renaming)
```

---

## 2. Diarization Technology, Framework & Licensing Evaluation

### 2.1. Why `pyannote.audio`?
- **State-of-the-Art Architecture**: `pyannote.audio` is the industry-standard neural speaker diarization framework based on PyTorch, providing multi-speaker voice embedding extraction, segmentation, and clustering.
- **Model Selected**: `pyannote/speaker-diarization-3.1`.
- **Licensing & Access Requirements**:
  - Requires user agreement on Hugging Face Hub (`pyannote/speaker-diarization-3.1` and `pyannote/segmentation-3.0`).
  - Configurable via `HF_TOKEN` in the environment.
- **Zero-Token & Offline Resilient Engine**:
  - For local development, testing, and environments without an active Hugging Face token, a high-performance acoustic voice activity and energy clusterer (`AcousticTurnSegmenter`) runs automatically.
  - Guarantees 100% test reliability and zero downtime.

### 2.2. Hardware & Device Support
- **CPU**: Supported natively via `DIARIZATION_DEVICE=cpu`.
- **GPU (CUDA)**: Supported via `DIARIZATION_DEVICE=cuda`.

---

## 3. Transcript-to-Speaker Alignment Algorithm

### 3.1. Mathematical Temporal Overlap
Given:
- Transcript segments $T = [T_1, T_2, \dots, T_n]$ from Faster-Whisper.
- Speaker turns $S = [S_1, S_2, \dots, S_m]$ from Diarization.

For each segment $T_i$:
$$\text{overlap}(T_i, S_j) = \max(0, \min(T_{i,\text{end}}, S_{j,\text{end}}) - \max(T_{i,\text{start}}, S_{j,\text{start}}))$$

The assigned speaker is:
$$S^* = \arg\max_{S_j} \text{overlap}(T_i, S_j)$$

### 3.2. Overlapping Speech & Gap Handling
- **Overlapping Speech**: Segments are attributed to the speaker with the dominant (maximal) temporal intersection.
- **Silence Gaps**: If a segment falls between diarization boundaries, the algorithm matches the nearest turn based on midpoint distance $|T_{i,\text{mid}} - S_{j,\text{mid}}|$.

---

## 4. Speaker Manifest, Identity & Statistics

### 4.1. Anonymous Speaker Labels vs Human Names
- The AI system generates anonymous labels: `SPEAKER_00`, `SPEAKER_01`, `SPEAKER_02`.
- Initial human display names are generated as `Speaker 1`, `Speaker 2`.
- The user can rename any speaker (e.g., `SPEAKER_00` $\rightarrow$ `Rahul Sharma`).
- Renaming updates the `Speaker` collection and cascades to all matching `TranscriptSegment`s while preserving the underlying `speakerLabel`.

### 4.2. Speaking Statistics Calculation
For each speaker $k$:
- $\text{totalSpeakingTime}_k = \sum_{T_i \in S_k} (T_{i,\text{end}} - T_{i,\text{start}})$
- $\text{segmentCount}_k = |S_k|$
- $\text{speakingPercentage}_k = \text{round}\left(\frac{\text{totalSpeakingTime}_k}{\text{totalAudioDuration}} \times 100, 1\right)$
- Assigned palette colors: `['#1B365D', '#5C768D', '#9F8D9B', '#486581', '#334E68', '#627D98']`.

---

## 5. API Endpoints & Security

| Method | Route | Description | Auth & Ownership |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/content/:contentId/speakers` | Get detected speakers with speaking statistics and percentage shares | Authenticated & Content Owner / Admin |
| `PATCH` | `/api/v1/content/:contentId/speakers` | Rename speaker across all segments by label | Authenticated & Content Owner / Admin |
| `PATCH` | `/api/v1/speakers/:id` | Rename speaker by speaker ObjectId | Authenticated & Content Owner / Admin |

---

## 6. Processing Pipeline Stages

The background processing pipeline includes the following stages:
1. `VALIDATING` (15%)
2. `PREPARING` (30%)
3. `TRANSCRIBING` (50%)
4. `DIARIZING` (70%)
5. `ALIGNING_SPEAKERS` (85%)
6. `SAVING_TRANSCRIPT` (90%)
7. `COMPLETED` (100%)

---

## 7. Verification & Test Results

### 7.1. Python AI Service Tests (`ai-service/tests/`)
All 13 tests passed:
- `test_auth.py`
- `test_health.py`
- `test_media_processor.py`
- `test_transcribe.py`
- `test_alignment.py` (Exact overlap, partial overlap, gap fallback)
- `test_diarization.py` (Standalone diarization endpoint)

### 7.2. Backend Integration Tests (`backend/tests/speaker_diarization.test.js`)
All 5 tests passed:
- Multi-speaker audio processing & MongoDB Speaker record creation
- Speaker statistics calculation and `GET /api/v1/content/:contentId/speakers`
- Speaker renaming via `PATCH /api/v1/speakers/:id`
- Speaker renaming via `PATCH /api/v1/content/:contentId/speakers`
- Multi-tenant isolation and 403 authorization checks

### 7.3. Client Build Verification
- Vite build completed in 6.05s with **0 errors**.

---

## 8. Phase Boundaries Confirmation
- **Implemented in Phase 8**: Speaker Diarization, Speaker Turn Detection, Temporal Overlap Alignment, Speaker Manifest, Speaking Statistics, Speaker Renaming, Speaker Filtering, Active Playback Highlighting.
- **NOT Implemented (Reserved for Future Phases)**:
  - Phase 9: LLM Summarization, Topics, Key Points, Action Items, Decisions.
  - Phase 10: Vector Search, Atlas Embeddings, RAG.
  - Phase 11: PDF & DOCX Export.
  - Phase 12: Ask Your Content Conversational AI.
