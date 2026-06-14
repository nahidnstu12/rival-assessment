# Taskflow Web

Next.js frontend — proxies `/api/*` to the Express backend.

## Setup

```bash
cd frontend
cp .env.example .env.local
# BACKEND_URL=http://localhost:4000

bun install
bun run dev    # http://localhost:3000
```

Run the backend on port 4000 first.

## Phase 2 (current)

- JWT cookie auth via same-origin `/api` proxy
- Login / signup pages
- Auth context hydrates from `GET /api/auth/me`
- Pending approval screen for `status=PENDING`
- Placeholder tasks list (Phase 3 = full UI)

## Demo login

```
Email: sabir@rival.io
Password: demo1234
```
