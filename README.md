# PublisherOS

Multi-tenant publishing infrastructure platform for modern media companies.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Frontend Routes](#frontend-routes)
- [Scripts](#scripts)
- [Security](#security)
- [Architecture](#architecture)

---

## Overview

PublisherOS is a session-based, multi-tenant SaaS platform. Users can register, create organisations, invite team members with role-based access, and manage their account.

**Current phase:** Authentication + multi-tenant foundation.

---

## Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Express 4 | Web framework |
| Prisma 5 | ORM + migrations |
| PostgreSQL 16 | Primary database |
| Redis 7 | Session / cache store |
| Argon2id | Password hashing |
| Zod | Runtime validation |
| Pino | Structured logging |
| Helmet + CORS | Security headers |
| express-rate-limit | Rate limiting |
| Nodemailer | Email transport |

### Frontend
| Package | Purpose |
|---|---|
| React 18 | UI framework |
| React Router 6 | Client-side routing |
| TanStack Query 5 | Server-state management |
| Vite 5 | Build tool / dev server |
| Tailwind CSS 3 | Utility-first styling |
| TypeScript 5 | Type safety |

---

## Project Structure

```
PublisherOS/
├── PublisherOS-Backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── index.ts              # Server entry point
│       ├── app.ts                # Express setup + middleware
│       ├── env.ts                # Env var validation (Zod)
│       ├── db.ts                 # Prisma client
│       ├── redis.ts              # Redis client
│       ├── logger.ts             # Pino logger
│       ├── openapi.ts            # OpenAPI / Swagger spec
│       ├── lib/
│       │   ├── errors.ts         # Custom error classes
│       │   ├── crypto.ts         # Token generation & hashing
│       │   └── slug.ts           # URL-safe slug generation
│       ├── middleware/
│       │   ├── authenticate.ts   # Session validation
│       │   ├── authorize.ts      # Org role-based access
│       │   ├── csrf.ts           # CSRF origin check
│       │   ├── errorHandler.ts   # Global error handler
│       │   ├── rateLimiter.ts    # Rate limiters
│       │   └── requestId.ts      # Correlation ID
│       ├── routes/
│       │   ├── index.ts          # Router composition
│       │   ├── health.ts         # /health, /ready
│       │   ├── auth.ts           # Auth endpoints
│       │   └── organizations.ts  # Org + member endpoints
│       └── services/
│           ├── authService.ts
│           ├── sessionService.ts
│           ├── organizationService.ts
│           └── emailService.ts
│
├── PublisherOS-Frontend/
│   └── src/
│       ├── App.tsx               # Route definitions
│       ├── config.ts             # Frontend config
│       ├── components/
│       │   ├── ProtectedRoute.tsx
│       │   └── ui/               # Button, Input, Alert, Select, Spinner, FormField
│       ├── layouts/
│       │   ├── RootLayout.tsx
│       │   ├── AuthLayout.tsx    # Centered card (login/register)
│       │   └── AppLayout.tsx     # Dashboard with sidebar
│       ├── pages/
│       │   ├── auth/             # Login, Register, ForgotPassword, ResetPassword, VerifyEmail
│       │   └── admin/            # Overview, OrgSettings, Team, Profile, Security
│       ├── providers/
│       │   └── AuthProvider.tsx  # Auth context + TanStack Query
│       ├── hooks/
│       │   └── useOrganizations.ts
│       ├── lib/
│       │   ├── api.ts            # Typed API client
│       │   └── queryClient.ts    # TanStack Query config
│       └── types/
│           └── index.ts
│
├── docker-compose.yml
├── start.sh                      # Native dev startup script
├── docs/
│   └── architecture.md
└── .env.example
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20 and npm ≥ 10
- PostgreSQL 16 running locally
- Redis 7 running locally

### Option A — Native (recommended for local dev)

```bash
# 1. Start Postgres + Redis via Homebrew
brew services start postgresql
brew services start redis

# 2. Install dependencies
cd PublisherOS-Backend && npm install
cd ../PublisherOS-Frontend && npm install

# 3. Set up environment
cp .env.example .env
# Edit .env — fill in DATABASE_URL, REDIS_URL, etc.

# 4. Run database migrations
cd PublisherOS-Backend
npm run db:migrate

# 5. Start everything with one command
cd ..
./start.sh
```

**URLs:**
| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (dev) | http://localhost:8000/api/v1/docs |
| Health check | http://localhost:8000/api/v1/health |

### Option B — Docker (deployment / CI)

> Requires Docker Desktop installed.

```bash
cp .env.example .env
docker compose up --build
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

```env
# ── Required ─────────────────────────────────────────────────────────────────
NODE_ENV=development
DATABASE_URL=postgresql://publisheros:publisheros@localhost:5432/publisheros
REDIS_URL=redis://localhost:6379

# ── Server ───────────────────────────────────────────────────────────────────
PORT=8000
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=info

# ── Session ──────────────────────────────────────────────────────────────────
SESSION_COOKIE_NAME=pos_session
SESSION_IDLE_TTL_DAYS=30        # Sliding idle window
SESSION_ABSOLUTE_TTL_DAYS=90    # Hard expiry
COOKIE_DOMAIN=                  # Leave blank for localhost

# ── Application ──────────────────────────────────────────────────────────────
APP_BASE_URL=http://localhost:5173

# ── Email (leave blank in dev — console stub used) ───────────────────────────
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=PublisherOS <noreply@publisheros.dev>

# ── Frontend ─────────────────────────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:8000
```

> `.env` is git-ignored. Never commit real credentials.

---

## API Reference

All endpoints are prefixed with `/api/v1`.

Interactive docs: **http://localhost:8000/api/v1/docs** (dev only)

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/ready` | Readiness check (DB + Redis) |

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Login, sets session cookie |
| POST | `/auth/logout` | Required | Revoke current session |
| GET | `/auth/me` | Required | Get current user |
| POST | `/auth/forgot-password` | — | Request password reset link |
| POST | `/auth/reset-password` | — | Complete password reset |
| POST | `/auth/verify-email` | — | Verify email with token |
| POST | `/auth/resend-verification` | Required | Resend verification email |

### Organizations

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/organizations` | Auth | Create new organisation |
| GET | `/organizations` | Auth | List your organisations |
| GET | `/organizations/:id` | Member | Get organisation |
| PATCH | `/organizations/:id` | Admin+ | Update org details |
| GET | `/organizations/:id/members` | Member | List members (paginated, 50/page) |
| PATCH | `/organizations/:id/members/:membershipId` | Admin+ | Update member role/status |

#### Role Hierarchy

```
OWNER  (3) — full control, cannot be removed if last owner
ADMIN  (2) — manage members and settings
STAFF  (1) — read-only access
```

### Auth Flow

```
Register → Verification email sent (24hr token)
        → POST /auth/verify-email → Account ACTIVE

Login   → HttpOnly session cookie set
        → All subsequent requests authenticated via cookie

Forgot  → Reset email sent (1hr token)
Password  → POST /auth/reset-password → All sessions revoked
```

---

## Database Schema

```
User
 ├── id, name, email (unique), passwordHash
 ├── status: ACTIVE | SUSPENDED | PENDING_VERIFICATION
 ├── emailVerifiedAt, platformRole (PLATFORM_ADMIN)
 ├── sessions[], memberships[]
 └── emailVerifications[], passwordResets[], auditEvents[]

Organization
 ├── id, name, slug (unique, URL-safe), status: ACTIVE | SUSPENDED
 ├── website, description
 └── memberships[], auditEvents[]

Membership                            (user ↔ org — unique pair)
 ├── id, userId, organizationId
 ├── role: OWNER | ADMIN | STAFF
 └── status: ACTIVE | SUSPENDED

Session
 ├── id, userId, tokenHash (SHA-256 — raw token never stored)
 ├── expiresAt (90 days absolute), revokedAt
 └── lastActiveAt (sliding 30-day idle), ipAddress, userAgent

EmailVerification
 ├── id, userId, tokenHash
 └── expiresAt (24 hours), usedAt (one-time use)

PasswordReset
 ├── id, userId, tokenHash
 └── expiresAt (1 hour), usedAt (one-time use)

AuditEvent
 ├── id, userId? (nullable), organizationId?
 ├── event (e.g. "auth.login_success", "membership.role_changed")
 └── metadata (JSON — no passwords or tokens), ipAddress, createdAt
```

---

## Frontend Routes

| Route | Page | Auth |
|---|---|---|
| `/` | Home / Landing | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/forgot-password` | Forgot Password | Public |
| `/reset-password` | Reset Password | Public |
| `/verify-email` | Verify Email | Public |
| `/dashboard` | Overview | Required |
| `/dashboard/organization` | Org Settings | Required |
| `/dashboard/team` | Team Members | Required |
| `/dashboard/profile` | Profile | Required |
| `/dashboard/security` | Security & Sessions | Required |

Protected routes redirect to `/login` if unauthenticated, preserving the intended destination.

---

## Scripts

### Backend (`PublisherOS-Backend/`)

```bash
npm run dev              # Dev server with auto-reload (tsx watch)
npm run build            # Compile TypeScript → dist/
npm start                # Run compiled build
npm run typecheck        # Type check only
npm run db:generate      # Regenerate Prisma client
npm run db:migrate       # Apply pending migrations
npm run db:migrate:dev   # Create + apply new migration interactively
```

### Frontend (`PublisherOS-Frontend/`)

```bash
npm run dev              # Vite dev server (http://localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run typecheck        # Type check
npm run lint             # ESLint
```

### Root

```bash
./start.sh               # Start backend + frontend together (Ctrl+C stops both)
```

---

## Security

| Feature | Implementation |
|---|---|
| Password hashing | Argon2id (m=65536, t=3, p=4) |
| Session tokens | 32-byte random, SHA-256 hash stored in DB |
| Cookies | HttpOnly, SameSite=Lax, Secure in production |
| Session expiry | 30-day idle window + 90-day absolute limit |
| CSRF protection | Origin header validation on all `/api/v1` requests |
| Rate limiting | 10 req/15 min (auth), 5 req/60 min (sensitive ops) |
| HTTP headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| Email enumeration | Forgot password always returns 200 |
| Timing attacks | Argon2 runs even for non-existent users |
| Token storage | SHA-256 hash only — raw token sent once via email |
| Audit trail | All auth and membership events logged with IP |

---

## Architecture

```
Browser
  │  (HttpOnly session cookie)
  ▼
React SPA — Vite (port 5173)
  │  (fetch with credentials: true)
  ▼
Express API (port 8000)
  ├── Middleware: Helmet, CORS, CSRF, RateLimit, RequestId, Pino
  ├── Routes → Services → Prisma ORM
  ├── PostgreSQL 16  (persistent data)
  └── Redis 7        (sessions / future cache)
```

**Key design decisions:**
- Session-based auth with HttpOnly cookies — safer than localStorage JWTs
- Tokens hashed before storage — a DB breach does not expose raw tokens
- Services validate authorisation independently from middleware (defence in depth)
- Generic error messages on auth failures — prevents user enumeration
- Fire-and-forget email sending — API response is never blocked by SMTP
- Audit events with nullable `userId` — captures pre-auth events safely

See [docs/architecture.md](docs/architecture.md) for full system design and future phases.
# PublisherOS
