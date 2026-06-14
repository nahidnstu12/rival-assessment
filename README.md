# Taskflow — Task Management App

Full-stack task manager built for the Rival assessment. Express + Prisma API, Next.js App Router frontend, JWT cookie auth, URL-driven filters.

## Prerequisites

- [Bun](https://bun.sh) 1.x (package manager + runtime)
- PostgreSQL — [Neon](https://neon.tech) cloud DB **or** local via Docker (see below)
- Node 20+ compatible environment (Bun satisfies this)

## Quick start

### 1. Database

**Option A — Docker (local)**

```bash
docker compose up -d
# DATABASE_URL=postgresql://taskflow:taskflow@localhost:5433/taskflow
```

**Option B — Neon**

Create a project, copy the connection string.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET (32+ chars)

bun install
bun run db:generate
bun run db:migrate
bun run db:seed
bun run dev          # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
echo 'BACKEND_URL=http://localhost:4000' > .env.local

bun install
bun run dev          # http://localhost:3000
```

### Demo accounts (after seed)

| Email | Password | Role | Status |
|-------|----------|------|--------|
| sabir@rival.io | demo1234 | ADMIN | APPROVED |
| pending@rival.io | demo1234 | USER | PENDING |

## Tests

```bash
cd backend && bun run test
cd frontend && bun run test
```

CI runs both on push/PR (`.github/workflows/ci.yml`) with a Postgres service container.

## Architecture

```
[ Browser ]
    │  same-origin /api/*  (httpOnly cookie)
    ▼
[ Next.js ]  ── rewrite ──►  [ Express API ]  ──►  [ PostgreSQL ]
```

- Frontend never calls the backend URL directly from the browser; `next.config.ts` rewrites `/api/*` → `BACKEND_URL`.
- JWT lives in an httpOnly cookie — survives refresh, not readable by JS.
- Task ownership enforced in Prisma queries (`where: { userId }`), not just UI.
- Filters, search, sort, and pagination live in URL search params; React Query key mirrors them.

## Assumptions & trade-offs

1. **JWT in httpOnly cookie** — XSS-safe, persists across refresh. Production needs `Secure` + `SameSite=Lax`.
2. **Same-origin proxy** — Extra hop, but avoids CORS/`SameSite=None` pain and keeps cookies same-site.
3. **URL as filter source of truth** — Shareable, refresh-safe; changing filter resets `page=1`.
4. **Offset pagination** — Simpler than cursors; fine at assessment scale.
5. **Consistent error envelope** — `{ error: { code, message, details? } }` on all non-2xx.
6. **Pending approval flow** — New signups get a cookie but 403 on protected routes until admin approves.
7. **Manual sort** — Drag-to-reorder updates `order` field; disabled on admin "All tasks" view (defaults to newest).

## Project layout

```
backend/     Express API, Prisma, auth, task CRUD
frontend/    Next.js App Router, TanStack Query, RHF + Zod
docs/        Phase plans and requirements
design-planning/   HTML design reference
```

## Deploy (manual)

1. **Neon** — production `DATABASE_URL`
2. **Render** — backend: `bun run build && bun start`, run `bun run db:deploy`, set env vars
3. **Vercel** — frontend: set `BACKEND_URL` to Render URL; rewrites stay active
4. Verify cookie flags in prod (`Secure: true`, `SameSite: Lax`)

## Scripts reference

| Location | Command | Purpose |
|----------|---------|---------|
| backend | `bun run dev` | API with watch |
| backend | `bun test` | Vitest + supertest |
| backend | `bun run db:seed` | Demo users + tasks |
| frontend | `bun run dev` | Next dev server |
| frontend | `bun test` | RTL component tests |
| root | `docker compose up -d` | Local Postgres on :5433 |
