# WrapAI — Content & Meeting Intelligence Platform
**"From Content to Clarity."**

WrapAI is an AI-powered content intelligence platform that transforms multi-modal assets (audio, video, documents, and remote links) into word-level timestamped transcripts with speaker diarization, executive summaries, thematic breakdowns, key decision registries, actionable tasks with assignees and deadlines, and grounded interactive Q&A (RAG).

---

## 🚀 Completed Phases
- **Phase 0: Architecture & System Blueprint** (41 architectural sections + System Blueprint)
- **Phase 1: Frontend UI & React Foundation** (React 18, Tailwind CSS, Redux Toolkit, 9 Workspace Tabs, User & Admin Dashboards)
- **Phase 2: Node.js + Express Backend Foundation** (Layered architecture, JWT Auth, RBAC, Ownership guards, Swagger docs, Jest & Supertest integration tests)
- **Phase 3: MongoDB Atlas Database & Schemas** (13 production Mongoose models, referenced transcript streams, diarization cascade, intelligence models, aggregation pipelines, development seed CLI)
- **Phase 4: Authentication, Authorization & Integration** (Short-lived JWTs, rotated HttpOnly refresh cookies, bcrypt 12 rounds, account status gates, profile/password management, Axios automatic refresh interceptors)
- **Phase 5: File Upload, Object Storage & Content Ingestion** (AWS S3 object storage abstraction, offline local fallback, multi-modal ingestion: Audio/Video/Docs/Text/URLs, upload progress % tracking, temporary signed presigned access URLs, user storage quota enforcement)
- **Phase 6: Redis & BullMQ Processing Infrastructure** (BullMQ queues, isolated workers, retry backoff, multi-tenant job management, admin telemetry)
- **Phase 7: Python AI Microservice & Speech-to-Text** (FastAPI, FFmpeg audio extraction/normalization to 16kHz mono WAV, Faster-Whisper CTranslate2, timestamped segments)
- **Phase 8: Speaker Diarization & Speaker-Aware Transcripts** (pyannote.audio turn clustering, temporal overlap transcript alignment, speaker manifest, percentage speaking shares, rename cascade)
- **Phase 9: Structured LLM Content Analysis** (LLMProvider abstraction: Gemini/OpenAI/Heuristic, TranscriptContextBuilder hierarchical chunking, Summary, Topics, Key Points, Decisions, Action Items with assignees, timestamp seeking, re-analysis without re-transcription)

---

## 🛠️ Quick Start

### 1. Backend (REST API Gateway)
```bash
cd backend
npm install
cp .env.example .env
npm run seed     # Seed realistic development database (rahul@wrapai.io & sarah.jenkins@wrapai.io / Password123)
npm run dev
```
Runs on [http://localhost:5000/api/v1](http://localhost:5000/api/v1).  
Interactive Swagger API documentation: [http://localhost:5000/api/v1/docs](http://localhost:5000/api/v1/docs).

### 2. Frontend (Client)
```bash
cd client
npm install
npm run dev
```
Runs on [http://localhost:5173/](http://localhost:5173/).

### 3. Run Backend Tests
```bash
cd backend
npm test
```

### 4. Run Python AI Service Tests
```bash
cd ai-service
pytest tests/
```

---

## 🔑 Demo Credentials (Seeded)
- **User Dashboard Account**: `rahul@wrapai.io` / `Password123`
- **Admin Dashboard Account**: `sarah.jenkins@wrapai.io` / `Password123`

---

## 📁 Repository Structure
```
wrapAI/
├── docs/                        # Complete Architecture & Phase Documentation
│   ├── WRAPAI_ARCHITECTURE_BLUEPRINT.md
│   ├── phase-2-backend.md
│   ├── phase-3-database.md
│   ├── phase-4-authentication.md
│   ├── phase-5-file-upload.md
│   ├── phase-6-processing.md
│   ├── phase-7-ai-service.md
│   ├── phase-8-speaker-diarization.md
│   └── phase-9-llm-intelligence.md
├── ai-service/                  # Python FastAPI AI Microservice
│   ├── app/
│   │   ├── api/                 # FastAPI routes & security deps (transcribe, diarize, analyze)
│   │   ├── core/                # Pydantic Settings & structured JSON logging
│   │   ├── models/              # Pydantic schemas (Transcribe, Diarize, StructuredAnalysis)
│   │   ├── processors/          # FFmpeg media normalizer & temp file manager
│   │   ├── prompts/             # Prompt engineering & injection defenses
│   │   ├── services/            # Faster-Whisper, pyannote Diarization, LLM providers & ContextBuilder
│   │   └── main.py              # Application entrypoint
│   ├── tests/                   # Pytest test suite (18 tests)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
├── client/                      # React 18 Single Page Application
│   ├── src/
│   │   ├── components/          # Reusable UI, Layout, Media, and Common components
│   │   ├── layouts/             # Public, User, and Admin Layouts
│   │   ├── pages/               # Public, Auth, User, Workspace (9 tabs), and Admin pages
│   │   ├── routes/              # Central routing & RBAC route guards
│   │   ├── services/            # Axios API client with automatic JWT & refresh interceptors
│   │   ├── store/               # Redux Toolkit store (auth, UI, workspace)
│   │   └── utils/               # Timecode & duration formatters
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/                     # Node.js + Express REST API Gateway
│   ├── src/
│   │   ├── config/              # DB connection, Redis connection, env config, Swagger specs
│   │   ├── constants/           # Roles, status codes, content types
│   │   ├── controllers/         # Request/response controllers (Auth, Content, Processing, Intelligence, Admin)
│   │   ├── database/            # Database seed CLI & migration routines
│   │   ├── middlewares/         # Auth, RBAC, Ownership, Validation, Rate limiter, Upload multer
│   │   ├── models/              # 13 Mongoose schemas (User, Content, ProcessingJob, Analysis, Transcript, Speaker, Topic, Decision, ActionItem, etc.)
│   │   ├── queues/              # BullMQ queue definitions (contentProcessingQueue)
│   │   ├── repositories/        # Database query abstractions & aggregations
│   │   ├── routes/              # Modular Express routes
│   │   ├── services/            # Business logic services (AIService, Intelligence, Transcript, Storage, etc.)
│   │   ├── workers/             # Dedicated background worker processes (Full AI pipeline)
│   │   ├── utils/               # ApiError, responseHandler, logger
│   │   ├── validators/          # Input schema validation
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server listener & database bootstrap
│   ├── tests/                   # 16 Jest + Supertest test suites (66 tests)
│   ├── package.json
│   └── .env.example
├── docker-compose.yml           # Redis, AI Service, API Gateway, and Worker orchestration
└── README.md
```

---

## 🗺️ Roadmap & Phases
- [x] **Phase 0**: Architecture & System Blueprint
- [x] **Phase 1**: Frontend UI & React Foundation
- [x] **Phase 2**: Node.js + Express Backend Foundation
- [x] **Phase 3**: MongoDB Atlas Database & Schemas
- [x] **Phase 4**: Authentication & RBAC (JWT / bcrypt / Refresh Cookies)
- [x] **Phase 5**: File Upload & Object Storage (S3 / Storage Abstraction)
- [x] **Phase 6**: Redis & BullMQ Processing Infrastructure
- [x] **Phase 7**: Speech-to-Text (Faster-Whisper & Python AI Service)
- [x] **Phase 8**: Speaker Diarization & Timestamp Alignment (pyannote.audio)
- [x] **Phase 9**: Structured LLM Content Analysis (Summaries, Topics, Decisions, Action Items)
- [ ] **Phase 10**: RAG & MongoDB Atlas Vector Search
- [ ] **Phase 11**: Report Generation (PDF & DOCX)
- [ ] **Phase 12**: Ask Your Content Conversational Assistant
- [ ] **Phase 13**: Admin Dashboard & Telemetry
- [ ] **Phase 14**: Testing, Security & Optimization
- [ ] **Phase 15**: Docker, CI/CD & Cloud Deployment
