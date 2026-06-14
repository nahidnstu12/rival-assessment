# Task Management App — Build Plan & Requirement Spec

> Doubles as: (1) a `PLAN.md` for the repo README context, and (2) a requirement prompt to feed Cursor section-by-section.
> Read the "Core Decisions" section first — every other section depends on it.

---

## 0. Stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | Current best practice; SSR-aware auth |
| Data fetching | TanStack Query (React Query) | Loading/empty/error states, pagination, optimistic UI for free |
| Forms + validation | React Hook Form + Zod | Minimal boilerplate; schema shared with backend |
| Styling | Tailwind CSS + shadcn/ui | Fast, responsive, accessible |
| Theme | next-themes | Dark mode bonus, persisted |
| Backend | Express + TypeScript | |
| ORM | Prisma | Migrations + type safety, pairs with TS frontend |
| DB | PostgreSQL (Neon) | Required; Neon free tier |
| Auth | JWT in httpOnly cookie | Survives refresh, XSS-safe |
| Hashing | bcrypt | |
| Backend validation | Zod | Same lib both ends |
| Tests | Vitest + supertest (API), React Testing Library (UI) | |
| Deploy | Vercel (FE) · Render (API) · Neon (DB) | Free; Hostinger shared hosting cannot run Node/Postgres |

---

## 1. Core Decisions (document these in README "Trade-offs")

1. **Auth token = JWT in an httpOnly cookie**, not localStorage. Survives page refresh, not readable by JS (XSS-safe).
2. **Same-origin proxy.** Frontend never calls the Render URL directly from the browser. Next.js `rewrites` (or a Route Handler) proxy `/api/*` → backend. This makes the httpOnly cookie same-origin so login persistence "just works" and avoids the `SameSite=None` + CORS pain in production. Trade-off: one extra hop.
3. **Filters / search / sort / pagination live in the URL** (`useSearchParams`). One source of truth → they combine automatically, survive refresh, and are shareable. The React Query key is just the param object.
4. **Ownership enforced at the data layer.** Every task query is scoped `where: { userId }`. UI hiding is not security.
5. **Consistent error envelope:** `{ "error": { "code": string, "message": string, "details"?: any } }` on every non-2xx.
6. **Offset pagination** (`page`, `limit`) over cursor — simpler, fine for this scale. Note the choice.

---

## 2. Architecture

```
[ Browser ]
    │  same-origin /api/*  (cookie attached)
    ▼
[ Next.js on Vercel ]
    │  proxy/rewrite → backend, forwards cookie
    ▼
[ Express API on Render ]  ──► [ Postgres on Neon ]
```

- `proxy.ts` guards authenticated routes server-side (redirect to `/login` if no valid session).
- Single API client wrapper on the frontend: attaches credentials, parses the error envelope, handles 401 → redirect globally.

---

## 3. Data Model (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String              // bcrypt hash
  role      Role     @default(USER)
  tasks     Task[]
  createdAt DateTime @default(now())
}

enum Role { USER ADMIN }

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      Status     @default(TODO)
  priority    Priority   @default(MEDIUM)
  dueDate     DateTime?
  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum Status   { TODO IN_PROGRESS DONE }
enum Priority { LOW MEDIUM HIGH }
```

---

## 4. API Contract

Base: `/api`. All task routes require auth.

| Method | Route | Body / Query | Success | Errors |
|---|---|---|---|---|
| POST | `/auth/signup` | `{email, password}` | 201 + cookie | 400, 409 (email exists) |
| POST | `/auth/login` | `{email, password}` | 200 + cookie | 400, 401 |
| POST | `/auth/logout` | — | 204 | — |
| GET | `/auth/me` | — | 200 `{user}` | 401 |
| POST | `/tasks` | `{title, description?, status?, priority?, dueDate?}` | 201 `{task}` | 400, 401 |
| GET | `/tasks` | `?status&search&sort&order&page&limit` | 200 `{data, page, total}` | 401 |
| GET | `/tasks/:id` | — | 200 `{task}` | 401, 403, 404 |
| PATCH | `/tasks/:id` | partial task | 200 `{task}` | 400, 401, 403, 404 |
| DELETE | `/tasks/:id` | — | 204 | 401, 403, 404 |

**Query params for GET /tasks**
- `status` = `TODO | IN_PROGRESS | DONE`
- `search` = title contains (case-insensitive)
- `sort` = `dueDate | priority | createdAt`
- `order` = `asc | desc`
- `page` (default 1), `limit` (default 10)

**Status codes:** 201 create · 400 validation · 401 unauthenticated · 403 wrong owner · 404 missing · 204 delete/logout.

---

## 5. Task Breakdown

### Task 1 — Backend CRUD
- [ ] Express + TS scaffold, Prisma init, connect Neon
- [ ] Task model + migration
- [ ] 5 CRUD endpoints with Zod validation on POST/PATCH
- [ ] Error envelope + correct status codes
- [ ] Offset pagination on GET /tasks

### Task 2 — Auth
- [ ] signup/login/logout/me
- [ ] bcrypt hash on signup, compare on login
- [ ] JWT signed → set as httpOnly cookie (`Secure`, `SameSite=Lax` same-origin)
- [ ] `requireAuth` middleware → attaches `req.userId`
- [ ] All task queries scoped to `userId`
- [ ] Frontend auth context hydrates from `/auth/me` on mount

### Task 3 — Frontend core
- [ ] API client wrapper (credentials, error parsing, 401 handling)
- [ ] `proxy.ts` route guard
- [ ] Task list: React Query, skeleton loaders, empty state w/ CTA, error state w/ retry
- [ ] Create/edit form (one reusable component): RHF + Zod, inline errors, disabled-while-pending
- [ ] Complete toggle + delete (confirm dialog)
- [ ] Responsive (test 375px + desktop)
- [ ] A11y: real labels, keyboard nav, modal focus trap + Esc

### Task 4 — Search / sort / filter
- [ ] Debounced search input → URL param
- [ ] Sort dropdown (dueDate / priority / createdAt) → URL param
- [ ] Status filter → URL param
- [ ] All read from `useSearchParams` → single React Query call → combine for free

### Task 5 — Deliverables
- [ ] README: working setup steps, run commands
- [ ] `.env.example` (both apps)
- [ ] ≥3 meaningful tests (see below)
- [ ] Clean commit history (Conventional Commits)
- [ ] "Assumptions & Trade-offs" section in README

---

## 6. Tests (pick the risky paths)
1. **API:** user A cannot read user B's task → 403 (proves authorization).
2. **API:** POST /tasks missing title → 400 with correct error envelope.
3. **UI:** task form shows validation error on empty title (RTL).
- Stretch: list renders empty/loading/error states correctly.

---

## 7. Bonus (do in this order, by ROI)
1. **Optimistic UI** — React Query `onMutate` + rollback. Near free.
2. **Dark mode** — next-themes. Free.
3. **CI** — GitHub Actions runs tests on push. ~30 min, big signal.
4. **Dockerized** — docker-compose for one-command local (API + Postgres). De-risks the reviewer running it.
- Skip unless time: SSE real-time, admin role, attachments, activity log. Ship 4 polished, not 8 broken.

---

## 8. Env Vars

**Backend `.env.example`**
```
DATABASE_URL=postgresql://...
JWT_SECRET=
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
PORT=4000
```

**Frontend `.env.example`**
```
BACKEND_URL=http://localhost:4000   # used by the Next.js proxy/rewrite, server-side only
```

---

## 9. Deploy Checklist
- [ ] Neon DB created, `DATABASE_URL` set on Render
- [ ] Backend on Render, env vars set, migrations run
- [ ] Frontend on Vercel, `BACKEND_URL` → Render URL, rewrites configured
- [ ] Cookie flags in prod: `Secure: true`, `SameSite=Lax` (same-origin via proxy)
- [ ] **End-to-end test on the live link: signup → login → refresh stays logged in → CRUD → logout**
- [ ] Public repo or access granted; both links in the email

---

## 10. Timeline (4 days)
- **Day 1** — docker-compose + Neon + Prisma + Express CRUD + validation + error envelope. Postman-green.
- **Day 2** — auth (bcrypt, JWT cookie, ownership) + Next.js scaffold + proxy + API client + auth context.
- **Day 3** — list, form, mutations, all UX states, responsive.
- **Day 4** — search/sort/filter via URL, tests, optimistic + dark mode + CI, deploy, README, live verify.

---

## 11. Cursor usage notes
- Feed sections 3, 4, 5 (Data Model + API Contract) as context first so generated code matches the contract.
- Build backend before frontend so the API client mirrors a real contract.
- Keep the error envelope and `where: { userId }` scoping in the prompt every time you generate a task handler — these are the two things AI agents silently drop.