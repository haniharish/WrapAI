# WrapAI — Phase 12: Collaboration, Advanced Access Control & Production Readiness

## Overview
Phase 12 elevates WrapAI into an enterprise-ready, multi-tenant intelligence platform with granular Role-Based Access Control (RBAC), multi-user workspaces, secure SHA-256 hashed team invitations, cross-workspace global semantic search, live in-app notifications, timestamped transcript comments, and production deployment containers.

---

## Key Architectures

### 1. Workspace Hierarchy & RBAC Matrix
WrapAI organizes data into a multi-tenant hierarchy:
`User` $\rightarrow$ `Workspace` (Personal vs Team) $\rightarrow$ `WorkspaceMember` (`OWNER`, `ADMIN`, `EDITOR`, `VIEWER`) $\rightarrow$ `Content` $\rightarrow$ `Reports` / `Chats` / `Comments`.

| Permission | OWNER | ADMIN | EDITOR | VIEWER |
| :--- | :---: | :---: | :---: | :---: |
| `WORKSPACE_DELETE` | ✅ | ❌ | ❌ | ❌ |
| `WORKSPACE_UPDATE` | ✅ | ✅ | ❌ | ❌ |
| `MEMBER_INVITE` | ✅ | ✅ | ❌ | ❌ |
| `MEMBER_ROLE_UPDATE` | ✅ | ✅ | ❌ | ❌ |
| `CONTENT_CREATE` | ✅ | ✅ | ✅ | ❌ |
| `CONTENT_EDIT` | ✅ | ✅ | ✅ | ❌ |
| `CONTENT_DELETE` | ✅ | ✅ | ✅ | ❌ |
| `REPORT_CREATE` | ✅ | ✅ | ✅ | ❌ |
| `CHAT_CREATE` | ✅ | ✅ | ✅ | ❌ |
| `COMMENT_CREATE` | ✅ | ✅ | ✅ | ✅ |
| `CONTENT_VIEW` | ✅ | ✅ | ✅ | ✅ |

### 2. Cryptographic Invitation Security
- Invitations are generated using 32-byte cryptographically secure random tokens (`crypto.randomBytes(32).toString('hex')`).
- Tokens are hashed using **SHA-256** (`tokenHash`) before persisting to MongoDB Atlas to prevent plaintext database token compromise.
- Invitations have expiration dates and support one-click acceptance or administrative revocation.

### 3. Cross-Workspace Global Semantic Search
- Global search executes semantic vector similarity queries across all workspaces accessible to the requesting user.
- Enforces strict workspace access boundaries before scoring embeddings to eliminate cross-tenant data leakage.
- Generates formatted deep-links with exact timestamp offsets (`/content/:id/transcript?t=93`) for instantaneous audio/video playback jumping.

### 4. Timestamped Collaboration Comments
- Comments can attach to `TRANSCRIPT` timestamps, `ANALYSIS` sections, or `REPORT` blocks.
- Supports nested replies, user mentions, author-only edit restrictions, and real-time in-app notification triggers.

### 5. Production Hardening & Observability
- **Correlation ID Tracking**: `correlationMiddleware` generates and attaches unique `X-Request-ID` tracing headers across every incoming request.
- **Deep Readiness Probes**: `/api/v1/health` and `/api/v1/health/ready` probe MongoDB Atlas, Redis BullMQ queues, and AI microservices.
- **Safe Account Cascade**: `userService.deleteAccount()` removes personal content, embeddings, transcripts, chats, and personal workspaces while leaving shared team workspaces intact.
- **Docker Compose**: Production multi-container orchestration for API Gateway, BullMQ worker, Redis, FastAPI AI service, and React Nginx client.

---

## Automated Test Coverage
- **18 Test Suites**: 102 / 102 tests passed.
- Test files include:
  - `phase12_collaboration_rbac.test.js`
  - `report.test.js`
  - `chat.test.js`
  - `llm_intelligence.test.js`
  - `speaker_diarization.test.js`
  - `ai_transcription.test.js`
  - `processing_queue.test.js`
  - `uploads.test.js`
  - `auth.test.js`
  - `user.test.js`
  - `admin.test.js`
  - `models.test.js`
  - `health.test.js`
  - `ownership.test.js`
  - `aggregations.test.js`
