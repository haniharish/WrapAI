# WrapAI — Phase 5: File Upload, Object Storage & Content Management Architecture

## 1. Overview & Objective

Phase 5 establishes the complete, production-grade content ingestion and object storage lifecycle for **WrapAI — "From Content to Clarity."**

In accordance with strict architectural requirements:
* **Large binary files are never stored inside MongoDB**. Binary media is streamed directly to Object Storage (AWS S3 with offline/local filesystem fallback adapter).
* **MongoDB stores metadata and state**: Ownership (`userId`), storage references (`storageKey`), format/codec details (`mimeType`, `fileSizeBytes`), and initial lifecycle state (`processingStatus: 'UPLOADED'`).
* **Multi-tenant privacy & security by default**: Stored files are private. Temporary signed presigned URLs (`/api/v1/content/:id/access`) with 1-hour expiration are generated strictly on authenticated demand.
* **Strict Phase Boundary**: No real AI transcription, Whisper, pyannote, Redis, BullMQ, or LLM summarization was faked or prematurely executed. Phase 5 completes when multi-modal media is safely ingested, validated, quota-enforced, and positioned in state `UPLOADED` ready for Phase 6.

---

## 2. Ingestion Modes & Supported Formats

| Mode | Format / Extensions | Max Size / Length | Ingestion Endpoint | Storage Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Audio File** | `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac` | 100 MB | `POST /api/v1/content/upload` | AWS S3 Object Storage (`users/{userId}/content/{uuid}/...`) |
| **Video File** | `.mp4`, `.webm`, `.mov`, `.mkv` | 500 MB | `POST /api/v1/content/upload` | AWS S3 Object Storage (`users/{userId}/content/{uuid}/...`) |
| **Document** | `.txt`, `.pdf`, `.docx`, `.doc` | 50 MB | `POST /api/v1/content/upload` | AWS S3 Object Storage (`users/{userId}/content/{uuid}/...`) |
| **Raw Text** | Verbatim text notes / meeting minutes | 100,000 chars | `POST /api/v1/content/text` | MongoDB Atlas `rawText` field |
| **Remote URL** | Public HTTPS media links | SSRF Protected | `POST /api/v1/content/url` | MongoDB Atlas `sourceUrl` field |

---

## 3. Storage Architecture & S3 Abstraction

### 3.1 Pluggable Storage Service (`backend/src/services/storageService.js`)
* **AWS S3 Provider**: Uses `@aws-sdk/client-s3` (`PutObjectCommand`, `DeleteObjectCommand`, `GetObjectCommand`) and `@aws-sdk/s3-request-presigner` (`getSignedUrl`).
* **Safe Deterministic Key Schema**:
  ```
  users/{userId}/content/{uuid}/{sanitizedFileName}.{extension}
  ```
* **Offline / Zero-Config Development Fallback**:
  If AWS credentials are not configured in local environment or testing, `StorageService` automatically activates `LocalStorageProvider` under `backend/uploads/` with 0 crashes, allowing 100% offline automated test execution and developer onboarding.

### 3.2 User Storage Quota Enforcement
* Each user document tracks `storageUsedBytes` vs `storageLimitBytes` (default 5 GB).
* During file upload, if `storageUsedBytes + incomingFileSize > storageLimitBytes`, request is rejected with `400 Bad Request (Storage quota exceeded)`.
* When a content item is deleted (`DELETE /api/v1/content/:id`), the S3 object is permanently erased and `storageUsedBytes` is automatically decremented.

---

## 4. API Endpoints Reference

### Content Ingestion & Management (`/api/v1/content`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/content/upload` | Bearer JWT | Multipart form-data file upload (Audio, Video, Document). |
| `POST` | `/api/v1/content/text` | Bearer JWT | Ingest verbatim raw text content. |
| `POST` | `/api/v1/content/url` | Bearer JWT | Ingest external media URL (with SSRF defense). |
| `GET` | `/api/v1/content` | Bearer JWT | Paginated list query with `search`, `type`, `status`, `sort`. |
| `GET` | `/api/v1/content/:id` | Bearer JWT | Retrieve full metadata and processing state. |
| `GET` | `/api/v1/content/:id/access` | Bearer JWT | Generate temporary presigned signed access URL. |
| `PATCH` | `/api/v1/content/:id` | Bearer JWT | Rename title, description, or tags. |
| `DELETE` | `/api/v1/content/:id` | Bearer JWT | Soft-delete record & remove binary object from storage. |

---

## 5. Verification & Testing

### Automated Test Suite (`backend/tests/uploads.test.js` & full suite)
* **12 of 12 Test Suites Passing**:
  1. `tests/uploads.test.js` (Audio/Video/Doc upload, S3 key format, storage quota, text/URL ingestion, SSRF protection, signed URLs).
  2. `tests/ownership.test.js` (Multi-tenant ownership barriers).
  3. `tests/content.test.js` (Pagination and filtering).
  4. `tests/auth.test.js` & `tests/auth_extended.test.js` (JWT + HttpOnly cookie authentication).
  5. `tests/aggregations.test.js`, `tests/admin.test.js`, `tests/chat.test.js`, `tests/intelligence.test.js`, `tests/models.test.js`, `tests/user.test.js`, `tests/health.test.js`.
* **Total Tests**: 43/43 passing (100% success rate).

### Frontend Production Build
* `npm run build` executed in `client/` producing 0 errors (`✓ built in 7.87s`).
