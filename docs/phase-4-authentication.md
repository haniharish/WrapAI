# WrapAI — Phase 4: Authentication, Authorization & Frontend-Backend Integration
**"From Content to Clarity"**
*Status: COMPLETED & VERIFIED (11/11 Backend Test Suites, 36/36 Tests Passed, 0 Frontend Build Errors)*

---

## 1. Executive Summary
Phase 4 connects the React frontend (`client/`) directly to the Node.js + Express backend (`backend/`) and MongoDB Atlas database. It implements a complete, enterprise-grade authentication and Role-Based Access Control (RBAC) architecture using short-lived JWT Access Tokens, rotated HttpOnly Refresh Token Cookies, secure bcrypt password hashing (12 salt rounds), immutable security audit logs, account lifecycle states (`ACTIVE` vs `SUSPENDED`), profile management, password resets, and user ownership validation.

---

## 2. Authentication Architecture & Token Strategy

```
┌─────────────────┐             ┌─────────────────────────┐             ┌─────────────────────┐
│  React Client   │             │   Node.js Express API   │             │    MongoDB Atlas    │
│  (Port 5173)    │             │   Gateway (Port 5000)   │             │   (Mongoose ODM)    │
└────────┬────────┘             └────────────┬────────────┘             └──────────┬──────────┘
         │                                   │                                     │
         │ 1. POST /api/v1/auth/login        │                                     │
         │ ─────────────────────────────────>│                                     │
         │                                   │ 2. Find User + verify bcrypt hash   │
         │                                   │ ───────────────────────────────────>│
         │                                   │<─────────────────────────────────── │
         │                                   │ 3. Check status !== 'SUSPENDED'     │
         │                                   │ 4. Issue:                           │
         │                                   │    - Access Token (15m, in Body)    │
         │                                   │    - Refresh Cookie (7d, HttpOnly)  │
         │                                   │ 5. AuditLog: 'USER_LOGIN'           │
         │<──────────────────────────────────│                                     │
         │ 6. Store token in localStorage    │                                     │
         │                                   │                                     │
         │ 7. Protected Request (with Bearer)│                                     │
         │ ─────────────────────────────────>│                                     │
         │                                   │ 8. authMiddleware verifies JWT      │
         │                                   │    + verifies resource ownership    │
         │<──────────────────────────────────│                                     │
         │                                   │                                     │
         │ 9. Token Expiry (401 response)    │                                     │
         │<──────────────────────────────────│                                     │
         │ 10. POST /api/v1/auth/refresh     │                                     │
         │     (Cookie sent automatically)   │                                     │
         │ ─────────────────────────────────>│ 11. Verify refresh secret & user    │
         │<──────────────────────────────────│ 12. Issue new Access + Rotated Cook │
         │ 13. Retry original failed request │                                     │
         │ ─────────────────────────────────>│                                     │
```

---

## 3. Token & Session Management Decisions

| Attribute | Strategy | Technical Justification |
| :--- | :--- | :--- |
| **Access Token** | JWT Bearer in memory / Axios interceptor | Valid for 15 minutes. Short lifespan minimizes exposure if intercepted. |
| **Refresh Token** | HttpOnly, Secure, SameSite: Lax Cookie | Valid for 7 days. JavaScript cannot read or extract it (mitigates XSS attack vectors). |
| **Token Rotation** | Rotated upon every refresh | Prevents token reuse; if a stale refresh token is reused, session can be flagged. |
| **Password Hashing**| `bcryptjs` with 12 salt rounds | High cryptographic resistance against brute force and rainbow table attacks. |
| **Password Visibility**| Mongoose `select: false` | `passwordHash` is excluded by default on queries, preventing accidental data leaks in JSON envelopes. |
| **Role Invariant** | Non-escalatable registration | `/auth/register` strictly forces `role: 'USER'` regardless of client payload parameters. |

---

## 4. Complete Authentication Lifecycle Endpoints

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public (Rate Limited) | Creates new user (forces `USER` role), issues JWT and HttpOnly refresh cookie. |
| `POST` | `/api/v1/auth/login` | Public (Rate Limited) | Authenticates credentials, verifies active status, issues tokens, updates `lastLoginAt`. |
| `POST` | `/api/v1/auth/refresh` | Public (Cookie-based) | Validates HttpOnly cookie and returns fresh 15-minute access token and rotated cookie. |
| `POST` | `/api/v1/auth/logout` | Public | Clears HttpOnly cookies and logs session termination. |
| `GET` | `/api/v1/auth/me` | Authenticated | Returns current authenticated user profile for session restoration. |
| `POST` | `/api/v1/auth/forgot-password` | Public (Rate Limited) | Dispatches secure crypto password reset token without leaking account existence. |
| `POST` | `/api/v1/auth/reset-password` | Public (Rate Limited) | Validates reset token and expiration, securely updates password. |
| `GET` | `/api/v1/users/me` | Authenticated | Retrieves current user profile details. |
| `PATCH` | `/api/v1/users/me` | Authenticated | Updates `fullName`, `avatar`, `timezone`, and `preferences`. |
| `PATCH` | `/api/v1/users/me/password` | Authenticated | Validates `currentPassword` and sets new hashed password with audit trail. |
| `DELETE`| `/api/v1/users/me` | Authenticated | Self-service account deletion. |
| `GET` | `/api/v1/admin/users` | Admin (`ADMIN` role) | Lists all users with pagination and search. |
| `PATCH` | `/api/v1/admin/users/:id/status`| Admin (`ADMIN` role) | Toggles account status (`ACTIVE` $\leftrightarrow$ `SUSPENDED`). |

---

## 5. Frontend-Backend Integration & Automatic Interceptors

Implemented in [`client/src/services/api.js`](file:///c:/Users/Lenovo/Desktop/wrapAI/client/src/services/api.js):
- **Axios Base Instance**: Configured with `withCredentials: true` and `baseURL: http://localhost:5000/api/v1`.
- **Request Interceptor**: Extracts `wrapai_token` from `localStorage` and automatically attaches `Authorization: Bearer <token>`.
- **Response Interceptor**:
  - Automatically unwraps standardized `{ success, data, message, meta }` response payloads.
  - On `401 Unauthorized` responses from protected APIs, seamlessly calls `POST /auth/refresh` with cookies, saves the new access token, and retries the original failed request without user interruption.
  - If refresh fails, cleans up credentials and redirects to `/login`.

---

## 6. Pre-Seeded Demo Credentials

The login page includes 1-click demo credential fillers backed by seeded MongoDB Atlas accounts:
- **Standard User**: `rahul@wrapai.io` / `Password123` $\rightarrow$ Redirects to `/dashboard`
- **Administrator**: `sarah.jenkins@wrapai.io` / `Password123` $\rightarrow$ Redirects to `/admin`

---

## 7. Automated Test Verification Summary

Executed with Jest and MongoMemoryServer:
```bash
npm test
```

**Results:**
```
PASS tests/auth_extended.test.js
PASS tests/intelligence.test.js
PASS tests/ownership.test.js
PASS tests/aggregations.test.js
PASS tests/admin.test.js
PASS tests/user.test.js
PASS tests/auth.test.js
PASS tests/health.test.js
PASS tests/models.test.js
PASS tests/content.test.js
PASS tests/chat.test.js

Test Suites: 11 passed, 11 total
Tests:       36 passed, 36 total
Snapshots:   0 total
Time:        176.66s with 0 failures
```

Client Production Build:
```bash
cd client; npm run build
✓ 1620 modules transformed.
✓ built in 6.19s with 0 errors.
```
