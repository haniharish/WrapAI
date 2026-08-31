# WrapAI — Content & Meeting Intelligence Platform
**"From Content to Clarity."**

WrapAI is an AI-powered content intelligence platform that transforms multi-modal assets (audio, video, documents, and remote links) into word-level timestamped transcripts with speaker diarization, executive summaries, thematic breakdowns, key decision registries, actionable tasks with assignees and deadlines, and grounded interactive Q&A (RAG).

---

## 🚀 Completed Phases
- **Phase 0: Architecture & System Blueprint** (41 architectural sections + System Blueprint)
- **Phase 1: Frontend UI & React Foundation** (React 18, Tailwind CSS, Redux Toolkit, 9 Workspace Tabs, User & Admin Dashboards)
- **Phase 2: Node.js + Express Backend Foundation** (Layered architecture, JWT Auth, RBAC, Ownership guards, Mongoose models, Swagger docs, Jest & Supertest integration tests)

---

## 🛠️ Quick Start

### 1. Frontend (Client)
```bash
cd client
npm install
npm run dev
```
Runs on [http://localhost:5173/](http://localhost:5173/).

### 2. Backend (REST API Gateway)
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Runs on [http://localhost:5000/api/v1](http://localhost:5000/api/v1).  
Interactive Swagger API documentation: [http://localhost:5000/api/v1/docs](http://localhost:5000/api/v1/docs).

### 3. Run Backend Tests
```bash
cd backend
npm test
```

---

## 📁 Repository Structure
```
wrapAI/
├── docs/                        # Complete Architecture & System Blueprint
│   ├── WRAPAI_ARCHITECTURE_BLUEPRINT.md
│   └── phase-2-backend.md
├── client/                      # React 18 Single Page Application
│   ├── src/
│   │   ├── components/          # Reusable UI, Layout, Media, and Common components
│   │   ├── layouts/             # Public, User, and Admin Layouts
│   │   ├── mocks/               # Mock datasets matching MongoDB Atlas schemas
│   │   ├── pages/               # Public, Auth, User, Workspace, and Admin pages
│   │   ├── routes/              # Central routing & RBAC route guards
│   │   ├── services/            # API service layer with standardized envelopes
│   │   ├── store/               # Redux Toolkit store (auth, UI, workspace)
│   │   └── utils/               # Timecode formatters and validators
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/                     # Node.js + Express REST API Gateway
│   ├── src/
│   │   ├── config/              # DB connection, env config, Swagger specs
│   │   ├── constants/           # Roles, status codes, content types
│   │   ├── controllers/         # Request/response controllers
│   │   ├── middlewares/         # Auth, RBAC, Ownership, Validation, Rate limiter, Errors
│   │   ├── models/              # User, Content, Report Mongoose schemas
│   │   ├── repositories/        # Database query abstractions
│   │   ├── routes/              # Modular Express routes
│   │   ├── services/            # Pure business logic services
│   │   ├── utils/               # ApiError, responseHandler, logger
│   │   ├── validators/          # Input schema validation
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server listener & database bootstrap
│   ├── tests/                   # Jest + Supertest test suites
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## 🗺️ Roadmap & Phases
- [x] **Phase 0**: Architecture & System Blueprint
- [x] **Phase 1**: Frontend UI & React Foundation
- [x] **Phase 2**: Node.js + Express Backend Foundation
- [ ] **Phase 3**: MongoDB Atlas Database & Schemas
- [ ] **Phase 4**: Authentication & RBAC (JWT / bcrypt)
- [ ] **Phase 5**: File Upload & Object Storage (S3 / Cloudinary)
- [ ] **Phase 6**: Redis & BullMQ Processing Infrastructure
- [ ] **Phase 7**: Speech-to-Text (Whisper)
- [ ] **Phase 8**: Speaker Diarization & Timestamp Alignment (pyannote)
- [ ] **Phase 9**: Structured LLM Content Analysis
- [ ] **Phase 10**: RAG & MongoDB Atlas Vector Search
- [ ] **Phase 11**: Report Generation (PDF & DOCX)
- [ ] **Phase 12**: Ask Your Content Conversational Assistant
- [ ] **Phase 13**: Admin Dashboard & Telemetry
- [ ] **Phase 14**: Testing, Security & Optimization
- [ ] **Phase 15**: Docker, CI/CD & Cloud Deployment
