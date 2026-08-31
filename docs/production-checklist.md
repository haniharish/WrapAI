# WrapAI — Production Deployment Checklist

## 1. Environment & Infrastructure
- [x] Set strong, distinct secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- [x] Configure production `MONGODB_URI` pointing to MongoDB Atlas with connection pooling (`maxPoolSize: 50`).
- [x] Configure dedicated Redis instance for BullMQ background workers and rate limiting.
- [x] Set `NODE_ENV=production` across all backend gateway and worker containers.
- [x] Configure CORS whitelist (`CLIENT_URL`) to allow only trusted frontend domains.

## 2. Security & Access Control
- [x] Enforce Role-Based Access Control (RBAC) across all routes (`OWNER`, `ADMIN`, `EDITOR`, `VIEWER`).
- [x] Use SHA-256 token hashing for all workspace invitations and public report sharing tokens.
- [x] Differentiated rate limiters active for Auth, Uploads, LLM/RAG, and Global Vector Search.
- [x] Helmet security headers and Correlation ID (`X-Request-ID`) attached on all HTTP responses.
- [x] Safe cascade deletion implemented for user GDPR/privacy compliance.

## 3. Background Workers & Resilience
- [x] BullMQ processing queue configured with exponential backoff retries and concurrency limits.
- [x] Graceful shutdown handling (`SIGTERM`, `SIGINT`) on Express server and BullMQ worker process.
- [x] Health checks (`/api/v1/health`) and Kubernetes readiness probes (`/api/v1/health/ready`) implemented.

## 4. Multi-Tenant Vector Search & AI Pipelines
- [x] Atlas Vector Search `$vectorSearch` with automatic in-memory cosine fallback for local dev.
- [x] Strict workspace pre-filtering applied before vector similarity scoring to ensure tenant isolation.
- [x] LLM analysis caching and token usage tracking aggregated per workspace.

## 5. Containerization
- [x] Dockerfile for Node.js API Gateway (multi-stage, non-root user).
- [x] Dockerfile for React frontend (Vite build + Nginx reverse proxy).
- [x] Dockerfile for Python FastAPI AI Service.
- [x] Orchestrated `docker-compose.yml` for unified local/staging deployment.
