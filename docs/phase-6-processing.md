# WRAPAI — PHASE 6: REDIS, BULLMQ & BACKGROUND PROCESSING INFRASTRUCTURE

**WrapAI — "From Content to Clarity."**

---

## 1. Overview & Architecture

Phase 6 implements the enterprise asynchronous processing foundation for WrapAI. Long-running AI intelligence workloads cannot run synchronously on the HTTP request cycle without causing request timeouts, server blocking, and resource starvation. 

Phase 6 decouples content ingestion from pipeline execution using **Redis**, **BullMQ**, dedicated **Background Worker Processes**, and a **Mongoose `ProcessingJob` state machine**.

```
[Client / UI]
     │
     │ 1. POST /api/v1/content/upload (or /text, /url)
     ▼
[Express API Gateway]
     │
     │ 2. Save Content & Create ProcessingJob (status: QUEUED)
     │ 3. Enqueue Job to BullMQ with Idempotency Guard
     ▼
[Redis Server (BullMQ Queue: 'content-processing')]
     │
     │ 4. Worker Dequeues Job (Concurrency: 2)
     ▼
[Dedicated Background Worker]
     │
     ├── Stage 1: VALIDATING (15% progress)
     ├── Stage 2: PREPARING (30% progress)
     ├── Stage 3: TRANSCRIBING [Mock Engine] (50% progress)
     ├── Stage 4: DIARIZING [Mock Engine] (70% progress)
     ├── Stage 5: ANALYZING [Mock Engine] (85% progress)
     └── Stage 6: GENERATING_REPORT [Mock Engine] (95% progress)
     │
     │ 5. Pipeline Complete (100% progress)
     ├── Update ProcessingJob (status: COMPLETED)
     └── Update Content (processingStatus: COMPLETED)
```

---

## 2. Implemented Components

### 2.1. Redis Connection Management (`backend/src/config/redis.js`)
- Supports standalone `REDIS_URL` or structured `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, and `REDIS_TLS`.
- Configured with BullMQ-compliant options (`maxRetriesPerRequest: null`, `enableReadyCheck: false`, exponential reconnect strategy).
- Graceful connection pooling and clean teardown handlers (`closeRedisConnections()`).

### 2.2. BullMQ Processing Queue (`backend/src/queues/contentProcessingQueue.js`)
- Queue name: `content-processing`.
- **Default Job Options**:
  - Exponential backoff retry: `attempts: 3`, `backoff: { type: 'exponential', delay: 2000 }`.
  - Retention policies: `removeOnComplete: { count: 100 }`, `removeOnFail: { count: 500 }`.
- Built-in In-Memory Mock Queue adapter for automated testing environments without an active Redis instance.

### 2.3. Queue Producer & Lifecycle Service (`backend/src/services/processingQueueService.js`)
- **Strict Idempotency**: Prevents duplicate active jobs for the same `contentId`. If a job is already in `QUEUED` or `PROCESSING` state, returns the existing active job.
- **Enqueuing**: Creates `ProcessingJob` document in MongoDB, marks `Content` as `QUEUED`, enqueues to BullMQ, and writes to `AuditLog`.
- **Retry Mechanism (`POST /api/v1/processing/:jobId/retry`)**:
  - Validates ownership or `ADMIN` role.
  - Resets job progress to 0%, status to `QUEUED`, attempts to 0, and re-adds to BullMQ queue.
- **Cancellation (`POST /api/v1/processing/:jobId/cancel`)**:
  - Marks job as `CANCELLED` in database and removes from BullMQ queue if waiting.
- **Multi-Tenant Ownership**: Strict ownership barriers preventing unauthorized access or manipulation across tenant boundaries.
- **Admin Telemetry (`GET /api/v1/processing/metrics`)**: Aggregates live Redis queue metrics (`waiting`, `active`, `completed`, `failed`) and MongoDB state breakdown.

### 2.4. Standalone Background Worker (`backend/src/workers/processingWorker.js` & `backend/src/workers/index.js`)
- Executable via `npm run worker` or `npm run worker:dev`.
- Configurable concurrency (`WORKER_CONCURRENCY`, default `2`).
- Simulates the complete AI pipeline lifecycle:
  1. `VALIDATING` (15%)
  2. `PREPARING` (30%)
  3. `TRANSCRIBING` (50%)
  4. `DIARIZING` (70%)
  5. `ANALYZING` (85%)
  6. `GENERATING_REPORT` (95%)
  7. `COMPLETED` (100%)
- **Controlled Failure Simulation**: For test and resilience validation, supports failing jobs if the title contains `[FAIL_TEST]` or `MOCK_PROCESSING_FAILURE=true`.
- **Cancellation Check**: Verifies cancellation status before advancing to each pipeline stage.
- Graceful shutdown handling on `SIGTERM` and `SIGINT`.

### 2.5. REST API Routes (`backend/src/routes/processing.routes.js`)
- `GET /api/v1/processing`: Paginated list of processing jobs for current user.
- `GET /api/v1/processing/:jobId`: Get single processing job details with ownership validation.
- `GET /api/v1/content/:contentId/processing`: Get latest processing job for a content item.
- `POST /api/v1/processing/:jobId/retry`: Retry failed or cancelled job.
- `POST /api/v1/processing/:jobId/cancel`: Cancel queued or running job.
- `GET /api/v1/processing/metrics` (Admin): Live queue telemetry.
- `GET /api/v1/processing/admin/all` (Admin): Paginated view of all jobs across the platform.

### 2.6. Frontend Integration
- **`client/src/services/processingService.js`**: Pure JavaScript REST client connecting to backend processing endpoints.
- **`client/src/pages/user/ProcessingPage.jsx`**:
  - Auto-polls status every 1.5 seconds.
  - Multi-stage visual checklist with live spinner, completed checkmarks, and error badges.
  - Progress bar ($0\%-100\%$).
  - Error state with one-click "Retry Processing Job" button.
  - Cancellation state with "Restart Processing" button.
  - Success transition banner with "Open Content Workspace" button.
  - Collapsible terminal-style execution log drawer.
- **`client/src/pages/admin/AdminProcessingPage.jsx`**:
  - 4 Real-time telemetry cards (Waiting, Active Workers, Completed, Failed).
  - Live jobs table with status badges and progress indicators.
  - Direct Retry and Cancel actions with auto-refresh (every 3 seconds).
- **`client/src/pages/user/UploadPage.jsx`**: Automatically routes to `/processing/:id` upon content ingestion.

### 2.7. Multi-Container Orchestration (`docker-compose.yml`)
- Orchestrates `redis` (redis:7-alpine), `backend` (Express API Gateway), and `worker` (Dedicated BullMQ Worker).

---

## 3. Verification & Test Results

All 13 backend test suites passed with **100% success rate (50/50 tests passing)**:

```
PASS tests/processing_queue.test.js (7/7 tests)
  √ should auto-enqueue processing job upon content upload and transition status to QUEUED
  √ should guarantee idempotency when processing is requested multiple times for the same content
  √ should process job through mock worker pipeline and transition content to COMPLETED
  √ should handle controlled failure and support manual job retry
  √ should support job cancellation
  √ should enforce multi-tenant isolation and prevent unauthorized access to processing jobs
  √ should allow users to list their own processing jobs and admin to view metrics

PASS tests/uploads.test.js (7/7 tests)
PASS tests/auth.test.js (6/6 tests)
PASS tests/auth_extended.test.js (4/4 tests)
PASS tests/content.test.js (3/3 tests)
PASS tests/intelligence.test.js (4/4 tests)
PASS tests/ownership.test.js (5/5 tests)
PASS tests/aggregations.test.js (3/3 tests)
PASS tests/admin.test.js (4/4 tests)
PASS tests/chat.test.js (2/2 tests)
PASS tests/models.test.js (2/2 tests)
PASS tests/user.test.js (2/2 tests)
PASS tests/health.test.js (1/1 test)

Test Suites: 13 passed, 13 total
Tests:       50 passed, 50 total
Snapshots:   0 total
```

Client build verification:
```
✓ 1620 modules transformed.
✓ built in 6.83s with 0 errors.
```
