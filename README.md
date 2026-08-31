# WrapAI — Content & Meeting Intelligence Platform
**"From Content to Clarity."**

WrapAI is an AI-powered content intelligence platform that transforms multi-modal assets (audio, video, documents, and remote links) into word-level timestamped transcripts with speaker diarization, executive summaries, thematic breakdowns, key decision registries, actionable tasks with assignees and deadlines, and grounded interactive Q&A (RAG).

---

## 🚀 Phase 1: Frontend Foundation Completed
- **Framework**: React 18 (JavaScript), React Router v6, Tailwind CSS, Redux Toolkit
- **Design Language**: Luxury SaaS, Editorial, Minimal, High-contrast, Anton display typography, Plus Jakarta Sans body
- **Architecture**: Decoupled mock service layer matching the Phase 0 API Contract
- **Dashboards**:
  - **User Dashboard**: Overview, Ingestion suite, Content Library, Master Content Workspace (9 intelligence tabs), Reports repository, Settings.
  - **Admin Dashboard**: System telemetry, User governance, Content monitoring, BullMQ queue inspector, Analytics, Infrastructure health monitor.

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 3. Production Build
```bash
npm run build
```

---

## 📁 Repository Structure
```
wrapAI/
├── docs/                        # Complete Architecture & System Blueprint
│   └── WRAPAI_ARCHITECTURE_BLUEPRINT.md
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
└── README.md
```

---

## 🗺️ Roadmap & Phases
- [x] **Phase 0**: Architecture & System Blueprint
- [x] **Phase 1**: Frontend UI & React Foundation
- [ ] **Phase 2**: Node.js + Express Backend Foundation
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
