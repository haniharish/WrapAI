# WrapAI — Content & Meeting Intelligence Platform
**"From Content to Clarity."**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-wrapai--client.onrender.com-blue?style=for-the-badge&logo=render)](https://wrapai-client.onrender.com)
[![API Gateway](https://img.shields.io/badge/API%20Gateway-Live%20on%20Render-green?style=for-the-badge)](https://wrapai-backend-y44w.onrender.com/api/v1/health)

WrapAI is an AI-powered content intelligence platform that transforms multi-modal assets (audio, video, documents, and remote links) into word-level timestamped transcripts with speaker diarization, executive summaries, thematic breakdowns, key decision registries, actionable tasks with assignees and deadlines, professional PDF/DOCX reports, interactive RAG Q&A with grounded citations, and enterprise multi-tenant team collaboration.

---

## 🌐 Live Production Deployment

- 🚀 **Live Web App**: [**https://wrapai-client.onrender.com**](https://wrapai-client.onrender.com)
- 🔌 **API Gateway**: [**https://wrapai-backend-y44w.onrender.com/api/v1**](https://wrapai-backend-y44w.onrender.com/api/v1)
- 📖 **Interactive Swagger Docs**: [**https://wrapai-backend-y44w.onrender.com/api/v1/docs**](https://wrapai-backend-y44w.onrender.com/api/v1/docs)

### 🔑 Demo Accounts (Click to auto-fill on login page)
| Role | Email | Password |
| :--- | :--- | :--- |
| **Standard User** | `rahul@wrapai.io` | `Password123!` |
| **Admin User** | `sarah.jenkins@wrapai.io` | `Password123!` |

---

## 🚀 Completed Platform Phases (100% Completed)
- **Phase 1: Frontend UI & React Foundation** (React 18, Tailwind CSS, Redux Toolkit, 9 Workspace Tabs, User & Admin Dashboards)
- **Phase 2: Node.js + Express Backend Foundation** (Layered architecture, JWT Auth, RBAC, Ownership guards, Swagger docs, Jest & Supertest integration tests)
- **Phase 3: MongoDB Atlas Database & Schemas** (Mongoose models, referenced transcript streams, diarization cascade, intelligence models, aggregation pipelines, development seed CLI)
- **Phase 4: Authentication, Authorization & Security** (Short-lived JWTs, rotated HttpOnly refresh cookies, bcrypt 12 rounds, account status gates, profile/password management, Axios automatic refresh interceptors)
- **Phase 5: File Upload, Object Storage & Ingestion** (AWS S3 object storage abstraction, offline local fallback, multi-modal ingestion: Audio/Video/Docs/Text/URLs, upload progress % tracking, temporary presigned access URLs, user storage quota enforcement)
- **Phase 6: Redis & BullMQ Processing Infrastructure** (BullMQ queues, isolated workers, retry backoff, multi-tenant job management, admin telemetry)
- **Phase 7: Python AI Microservice & Speech-to-Text** (FastAPI, FFmpeg audio extraction/normalization to 16kHz mono WAV, Faster-Whisper CTranslate2, timestamped segments)
- **Phase 8: Speaker Diarization & Speaker-Aware Transcripts** (pyannote.audio turn clustering, temporal overlap transcript alignment, speaker manifest, percentage speaking shares, rename cascade)
- **Phase 9: Structured LLM Content Analysis** (LLMProvider abstraction: Gemini/OpenAI/Heuristic, TranscriptContextBuilder hierarchical chunking, Summary, Topics, Key Points, Decisions, Action Items with assignees, timestamp seeking, re-analysis)
- **Phase 10: Embeddings, Vector Search & RAG AI Content Chat** (MongoDB Atlas Vector Search with in-memory cosine fallback, multi-turn conversational chat, grounded citations with speaker + timestamp offsets, streaming responses)
- **Phase 11: Report Generation, Document Export & Sharing** (Multi-format PDF, DOCX, Markdown, and JSON report compilation, async BullMQ worker generation, SHA-256 secure public sharing tokens with revocation)
- **Phase 12: Collaboration, Advanced Access Control & Production Readiness** (Centralized RBAC permission engine, Personal & Team workspaces, SHA-256 hashed team invites, cross-workspace global semantic search, timestamped transcript comments, in-app notifications, correlation request tracing, deep readiness probes, safe cascade deletion, Docker orchestration)

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

### 3. Run Backend Tests (18 Suites / 102 Tests)
```bash
cd backend
npm test
```

### 4. Run Python AI Service Tests
```bash
cd ai-service
pytest tests/
```

### 5. Production Docker Compose
```bash
docker-compose up --build
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
│   ├── phase-9-llm-intelligence.md
│   ├── phase-10-vector-search-rag.md
│   ├── phase-11-report-generation.md
│   ├── phase-12-production.md
│   └── production-checklist.md
├── ai-service/                  # Python FastAPI AI Microservice
│   ├── app/
│   │   ├── api/                 # FastAPI routes & security deps (transcribe, diarize, analyze, embeddings)
│   │   ├── core/                # Pydantic Settings & structured JSON logging
│   │   ├── models/              # Pydantic schemas (Transcribe, Diarize, StructuredAnalysis)
│   │   ├── processors/          # FFmpeg media normalizer & temp file manager
│   │   ├── prompts/             # Prompt engineering & injection defenses
│   │   ├── services/            # Faster-Whisper, pyannote Diarization, LLM providers & ContextBuilder
│   │   └── main.py              # Application entrypoint
│   ├── tests/                   # Pytest test suite
│   ├── requirements.txt
│   └── Dockerfile
├── client/                      # React 18 Single Page Application
│   ├── src/
│   │   ├── components/          # Reusable UI, Layout, Media, WorkspaceSwitcher, NotificationBell, GlobalSearchModal, CommentsPanel
│   │   ├── layouts/             # Public, User, and Admin Layouts
│   │   ├── pages/               # Public, Auth, User, Workspace (9 tabs), Admin, WorkspaceSettings, AcceptInvite
│   │   ├── routes/              # Central routing & RBAC route guards
│   │   ├── services/            # Axios API client with automatic JWT & refresh interceptors
│   │   ├── store/               # Redux Toolkit store (auth, UI, workspace)
│   │   └── utils/               # Timecode & duration formatters
│   ├── nginx.conf
│   ├── Dockerfile
│   └── vite.config.js
├── backend/                     # Node.js + Express REST API Gateway
│   ├── src/
│   │   ├── config/              # DB connection, Redis connection, env config, Swagger specs
│   │   ├── constants/           # Roles, status codes, content types
│   │   ├── controllers/         # Request/response controllers (Auth, Content, Processing, Intelligence, Reports, Chat, Search, Workspace, Comments, Notifications, Admin)
│   │   ├── database/            # Database seed CLI & migration routines
│   │   ├── middlewares/         # Auth, RBAC, Ownership, Correlation, Validation, Rate limiter, Upload multer
│   │   ├── models/              # 18 Mongoose schemas (User, Content, ProcessingJob, Analysis, Transcript, Speaker, Topic, Decision, ActionItem, Report, ChatSession, ChatMessage, EmbeddingChunk, Workspace, WorkspaceMember, WorkspaceInvitation, Comment, Notification, UsageRecord)
│   │   ├── queues/              # BullMQ queue definitions (contentProcessingQueue, reportQueue)
│   │   ├── repositories/        # Database query abstractions & aggregations
│   │   ├── routes/              # Modular Express routes
│   │   ├── services/            # Business logic services (AIService, Intelligence, Transcript, Storage, Report, Chat, Search, Workspace, Comment, Notification, Usage, Authorization)
│   │   ├── workers/             # Dedicated background worker processes (Full AI pipeline & Report workers)
│   │   ├── utils/               # ApiError, responseHandler, logger
│   │   ├── validators/          # Input schema validation
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server listener & database bootstrap
│   ├── tests/                   # 18 Jest + Supertest test suites (102 tests)
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml           # Redis, AI Service, API Gateway, BullMQ Worker, and Client Nginx orchestration
└── README.md
```
