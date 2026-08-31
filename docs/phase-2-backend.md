# WrapAI — Phase 2: Backend Architecture & Implementation Guide
**"From Content to Clarity"**
*Status: COMPLETED*

---

## 1. Executive Summary
Phase 2 establishes the core Node.js + Express REST API Gateway for WrapAI. It transitions the application from Phase 1 mock services to a robust, layered backend architecture ready to integrate MongoDB Atlas, JWT authentication, role-based access control (RBAC), multi-tenant ownership enforcement, and API documentation via Swagger/OpenAPI.

---

## 2. Layered Architecture Design

```
HTTP Client (React / Mobile / API Consumer)
     │
     ▼
[Express Router: /api/v1/*]
     │
     ├──> [Helmet & CORS] (Origin Validation & Secure Headers)
     ├──> [Rate Limiter] (IP-based Request Throttling)
     ├──> [Body Parser & Cookie Parser]
     │
     ▼
[Authentication & RBAC Middleware]
     ├──> Verifies Bearer JWT Token
     ├──> Validates User Exists & Is Active
     └──> Enforces Role Constraints ('USER' vs 'ADMIN')
     │
     ▼
[Resource Ownership Guard Middleware]
     └──> Asserts resource.userId === req.user.id (or req.user.role === 'ADMIN')
     │
     ▼
[Validation Middleware]
     └──> Validates Request Body / Params / Query Schema
     │
     ▼
[Controller Layer]
     └──> Extracts Parameters, calls Service, maps HTTP Status & Response
     │
     ▼
[Service Layer]
     └──> Pure Domain Logic, Authorization Rules, State Validation
     │
     ▼
[Repository / Model Layer (Mongoose ODM)]
     └──> Encapsulates MongoDB Atlas Queries, Projections & Index Usage
     │
     ▼
[MongoDB Atlas Database]
```

---

## 3. Standardized Response & Error Contracts

### Success Contract
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

### Error Contract
```json
{
  "success": false,
  "message": "Request validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Valid email address is required"
    }
  }
}
```

---

## 4. Authentication & RBAC Flow
1. **Registration**: User submits `fullName`, `email`, and `password`. The service verifies email uniqueness, hashes the password via `bcryptjs` (12 rounds), persists the record with `USER` role, and issues a 15-minute access JWT.
2. **Login**: User submits credentials. The service retrieves the user (including `+passwordHash`), compares candidate password via `bcrypt.compare()`, and returns signed tokens.
3. **Protected Access**: Requests include `Authorization: Bearer <token>`. The `authenticate` middleware decodes the token, loads the current user from MongoDB, checks that `status !== 'SUSPENDED'`, and attaches `req.user`.
4. **Role Authorization**: Admin routes utilize `authorize('ADMIN')` to reject standard users with `403 FORBIDDEN`.
5. **Ownership Guard**: Resource routes (`/content/:id`, `/reports/:id`) utilize `checkOwnership()` to ensure users cannot view, modify, or delete resources belonging to other tenants.

---

## 5. What is Intentionally Deferred to Future Phases
- **Phase 3**: Full MongoDB Atlas vector indexes and embedded transcript models.
- **Phase 5**: Real AWS S3 / Cloudinary presigned upload URLs.
- **Phase 6**: Redis & BullMQ worker queue processors.
- **Phases 7–10**: Python FastAPI speech-to-text, pyannote diarization, LLM extraction, and RAG vector search.
