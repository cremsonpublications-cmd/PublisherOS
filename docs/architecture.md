# PublisherOS — Architecture

## Overview

PublisherOS is a multi-tenant SaaS platform for publishing companies. It manages
content, distribution, and provider integrations on behalf of multiple publishers
from a single deployment.

This document reflects the **Phase 1 foundation**. Business models and tenant
management will be added in subsequent phases.

---

## Monorepo Structure

```
PublisherOS/
├── PublisherOS-Frontend/   React + Vite + TypeScript + Tailwind CSS
├── PublisherOS-Backend/    Node.js + Express + TypeScript + Prisma + Redis
├── docs/                   Architecture and setup documentation
├── docker-compose.yml      Local development services
├── tsconfig.base.json      Shared TypeScript compiler options
└── package.json            npm workspace root + convenience scripts
```

**Why a monorepo?**
Frontend and backend live in one repository for simpler cross-cutting changes
and a unified lock-file.

**Why separate workspace packages with their own deps?**
The web bundle must never include server-only packages (Prisma, Pino, ioredis).
Workspace isolation enforces this boundary at the `npm install` level.

---

## Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Frontend framework | React 18 + Vite | Fast HMR, wide ecosystem, shadcn/ui-compatible |
| Styling | Tailwind CSS + shadcn/ui tokens | Utility-first; CSS variables for theming |
| Client state | TanStack Query | Server-state cache with stale-while-revalidate |
| Routing | React Router v6 | Declarative, file-agnostic routes |
| Backend framework | Express.js | Minimal, well-understood, large middleware ecosystem |
| ORM | Prisma | Type-safe queries, migration tooling, clear schema |
| Database | PostgreSQL 16 | ACID, JSON support, Prisma first-class support |
| Cache | Redis 7 (ioredis) | Actively maintained; future pub/sub, rate-limiting |
| Logging | Pino | Fastest Node.js JSON logger; structured output |
| Validation | Zod | Runtime + compile-time safety for env and requests |
| OpenAPI UI | Scalar | Modern, clean interface served at `/api/v1/docs` |

---

## Multi-Tenant Readiness

**Current state:** The Phase 1 schema has no models. Tenant isolation does not
yet exist.

**Requirements for future phases:**

1. **Every business record belongs to a publisher.**
   Every table storing publisher data (articles, authors, distributions, etc.)
   must have a non-nullable `publisherId` foreign key referencing a `Publisher`
   table.

2. **Tenant authorization is enforced by the backend.**
   Every API handler that reads or writes publisher data must verify that the
   authenticated user's `publisherId` matches the requested resource's
   `publisherId`. Frontend filtering is UI convenience only — it is not a
   security boundary.

3. **Provider credentials are isolated by publisher.**
   Third-party API keys, OAuth tokens, and webhook secrets must be stored per
   publisher and never shared or leaked across tenants.

4. **Migrations must preserve existing data.**
   Use `prisma migrate dev` to create migration files. Never use `prisma db push`
   or `prisma migrate reset` in any environment that has data.

5. **Row-level isolation approach (recommended).**
   A single database with `publisherId` columns on every tenant-scoped table.
   The alternative (schema-per-tenant or database-per-tenant) is more complex and
   not recommended for the initial phases.

---

## Local Development Environment

All local services run in Docker Compose.

```
localhost:5173  →  web  (Vite dev server)
localhost:8000  →  api  (Express + tsx watch)

Internal only (no host ports):
  postgres  (PostgreSQL 16)
  redis     (Redis 7)
```

The `api` service overrides `DATABASE_URL` and `REDIS_URL` to use Docker-internal
hostnames (`postgres`, `redis`). Your local `.env` still holds
`localhost`-based URLs for running the API outside of Docker.

---

## Environment Variables Reference

| Variable | Service | Description |
|---|---|---|
| `NODE_ENV` | api | `development` \| `production` \| `test` |
| `PORT` | api | HTTP port (default 8000) |
| `DATABASE_URL` | api | PostgreSQL connection string |
| `REDIS_URL` | api | Redis connection string |
| `CORS_ORIGINS` | api | Comma-separated allowed CORS origins |
| `LOG_LEVEL` | api | Pino level: `trace`…`fatal` |
| `VITE_API_BASE_URL` | web | Browser-visible API base URL |

---

## Future Phases

- **Phase 2:** Authentication (sessions or JWT), user management, Publisher CRUD
- **Phase 3:** Core business models — articles, authors, distributions
- **Phase 4:** Provider integrations — email, social, webhooks
- **Phase 5:** Background jobs, scheduling, event queues
