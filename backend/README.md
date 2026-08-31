# WrapAI — Backend API Gateway (Phase 2)
**"From Content to Clarity."**

This is the Node.js + Express REST API Gateway for the WrapAI platform. It manages authentication, user profiles, content metadata registries, report compilation endpoints, administrative governance, and security controls.

---

## 🏗️ Layered Architecture
```
Request
  ↓
Route Layer (/api/v1/*)
  ↓
Middleware Layer (Security, Auth, RBAC, Ownership, Validation, Rate Limiting)
  ↓
Controller Layer (Request unpacking & response mapping)
  ↓
Service Layer (Core business logic & domain operations)
  ↓
Repository Layer (Data access abstractions)
  ↓
Mongoose ODM / MongoDB Atlas Database
```

---

## 📁 Directory Structure
```
backend/
├── src/
│   ├── config/              # Database connection, environment variables, Swagger OpenAPI spec
│   ├── constants/           # HTTP status codes, error codes, roles, content types, processing states
│   ├── controllers/         # Thin HTTP request/response controllers
│   ├── middlewares/         # Auth (JWT), RBAC, Ownership, Validation, Rate limiter, Error handler
│   ├── models/              # Mongoose schemas (User, Content, Report)
│   ├── repositories/        # Clean database query abstractions
│   ├── routes/              # Modular Express route definitions
│   ├── services/            # Pure business logic services
│   ├── utils/               # ApiError, responseHandler, asyncHandler, logger
│   ├── validators/          # Input schema validation functions
│   ├── app.js               # Express application setup & middleware assembly
│   └── server.js            # Server listener, database connection, graceful shutdown
├── tests/                   # Jest + Supertest integration & unit test suites
├── .env.example             # Template for required environment variables
├── .gitignore               # Excludes .env, node_modules, and logs
└── package.json             # ES module dependencies & test scripts
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP port for the Express server | `5000` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `CLIENT_URL` | Allowed origin for CORS | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb://localhost:27017/wrapai` |
| `JWT_SECRET` | Secret key for signing access JWTs | - |
| `JWT_EXPIRES_IN` | Access token lifespan | `15m` |
| `REFRESH_TOKEN_SECRET`| Secret key for refresh tokens | - |
| `REFRESH_TOKEN_EXPIRES_IN`| Refresh token lifespan | `7d` |

### 3. Start Development Server
```bash
npm run dev
```

### 4. Run Automated Test Suite
```bash
npm test
```

---

## 📚 API Endpoints Overview (Base Path: `/api/v1`)

### Health
- `GET /api/v1/health` — System status, uptime, and database connectivity.

### Authentication & Profiles
- `POST /api/v1/auth/register` — Register a new account.
- `POST /api/v1/auth/login` — Sign in and receive JWT token.
- `POST /api/v1/auth/logout` — Clear auth cookie.
- `GET /api/v1/auth/me` — Current authenticated user profile.
- `GET /api/v1/users/me` — User profile details.
- `PATCH /api/v1/users/me` — Update full name, timezone, preferences.
- `PATCH /api/v1/users/me/password` — Change password with current password verification.
- `DELETE /api/v1/users/me` — Delete account.

### Content Management
- `GET /api/v1/content` — Paginated list of user content with search and filters.
- `POST /api/v1/content` — Register new uploaded content item.
- `GET /api/v1/content/:id` — Get content details (Ownership enforced).
- `PATCH /api/v1/content/:id` — Update content title/description (Ownership enforced).
- `DELETE /api/v1/content/:id` — Soft-delete content (Ownership enforced).

### Reports
- `GET /api/v1/reports` — Paginated list of user reports.
- `GET /api/v1/reports/:id` — Get report details (Ownership enforced).

### Admin Governance (Requires `ADMIN` role)
- `GET /api/v1/admin/overview` / `GET /api/v1/admin/metrics` — Aggregate system telemetry.
- `GET /api/v1/admin/users` — Paginated user directory with search and status filters.
- `PATCH /api/v1/admin/users/:id/status` — Activate/suspend user account.
- `GET /api/v1/admin/content` — Global content registry.
- `GET /api/v1/admin/processing` — BullMQ queue telemetry.
- `GET /api/v1/admin/analytics` — Platform analytics and usage trends.
- `GET /api/v1/admin/system` — Service health latencies and log stream.

---

## 🔒 Security Invariants
1. **Password Hashing**: `bcryptjs` with 12 salt rounds; plain text passwords never persisted or logged.
2. **Resource Ownership**: Every request for `/content/:id` or `/reports/:id` verifies `resource.userId === req.user.id` unless requester is `ADMIN`.
3. **Multi-Tenant Isolation**: Database queries automatically scope to authenticated `userId`.
4. **Defensive Validation**: All endpoints validate input data and reject malformed schemas with `400 BAD_REQUEST`.
5. **No Leaked Stack Traces**: Production error envelopes mask internal error details and return clean JSON envelopes.
