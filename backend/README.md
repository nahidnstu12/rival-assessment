# Taskflow API

Express + Prisma + PostgreSQL backend.

## Setup

```bash
cd backend
cp .env.example .env
# set DATABASE_URL + JWT_SECRET

bun install
bun run db:migrate
bun run db:seed       # demo users, password: demo1234
bun run dev           # http://localhost:4000
```

## Auth

JWT stored in `httpOnly` cookie named `token`. Send credentials with requests (`credentials: "include"`).

| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| POST | /auth/signup | — | `{name,email,password}` → 201, status=PENDING, sets cookie |
| POST | /auth/login | — | 403 if PENDING/REJECTED, 200 + cookie if APPROVED |
| POST | /auth/logout | — | 204, clears cookie |
| GET | /auth/me | cookie | returns `{ user }` |
| POST | /tasks | approved | create |
| GET | /tasks | approved | list + filters |
| GET | /tasks/:id | approved | owner scoped → 404 |
| PATCH | /tasks/:id | approved | partial update |
| DELETE | /tasks/:id | approved | 204 |
| GET | /admin/users | admin | all users + task counts |
| PATCH | /admin/users/:id | admin | `{ status }` |

## Demo accounts (after seed)

| Email | Password | Role | Status |
|-------|----------|------|--------|
| sabir@rival.io | demo1234 | ADMIN | APPROVED |
| tanvir@rival.io | demo1234 | USER | APPROVED |
| pending@rival.io | demo1234 | USER | PENDING |

## Error envelope

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }
```
