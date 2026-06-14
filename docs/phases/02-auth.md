# Phase 2 — Authentication & Authorization

> Goal: JWT cookie auth with pending-approval flow. Admin can approve/reject users. All task routes ownership-scoped.

---

## Auth flow (from design)

```
Signup  → creates user with status=PENDING, sets cookie, returns { pendingApproval: true }
Login   → if status=PENDING  → 403 { error: { code: "PENDING_APPROVAL" } }
           if status=REJECTED → 403 { error: { code: "ACCOUNT_REJECTED" } }
           if status=APPROVED → 200 + cookie
Admin   → PATCH /admin/users/:id { status: "APPROVED"|"REJECTED" }
```

---

## Checklist

### Backend
- [ ] Install: `bcrypt`, `jsonwebtoken`, `@types/bcrypt`, `@types/jsonwebtoken`
- [ ] **POST /auth/signup** — validate `{name, email, password}`, hash pw, create User (`status: PENDING`), sign JWT, set cookie, 201 `{ user, pendingApproval: true }`
- [ ] **POST /auth/login** — find user by email, compare hash, check `status`:
  - `PENDING` → 403 `PENDING_APPROVAL`
  - `REJECTED` → 403 `ACCOUNT_REJECTED`
  - `APPROVED` → 200 + set cookie
- [ ] **POST /auth/logout** — clear cookie, 204
- [ ] **GET /auth/me** — verify cookie, return `{ id, name, email, role, status }`, 401 if invalid
- [ ] `requireAuth` middleware — verify JWT, attach `req.userId` + `req.userRole` + `req.userStatus`
- [ ] `requireApproved` middleware — check `req.userStatus === "APPROVED"`, else 403
- [ ] `requireAdmin` middleware — check `req.userRole === "ADMIN"`, else 403
- [ ] Mount on task routes: `requireAuth + requireApproved`
- [ ] Mount on admin routes: `requireAuth + requireAdmin`
- [ ] All task queries: `where: { ..., userId: req.userId }` — never skip
- [ ] GET /tasks `scope=all`: skip userId filter only if `req.userRole === "ADMIN"`

### Frontend (auth layer only — UI in Phase 3)
- [ ] `frontend/src/lib/api.ts` — fetch wrapper, `credentials: "include"`, parse error envelope, intercept 401 → redirect `/login`
- [ ] `AuthContext` — `user | null`, `isLoading`; calls `GET /api/auth/me` on mount; exposes `login()`, `logout()`, `isAdmin`, `isPending`
- [ ] `proxy.ts` — check cookie token presence:
  - no token + protected route → redirect `/login`
  - has token + `/login|/signup` → redirect `/tasks`
- [ ] `next.config.ts` rewrites: `/api/:path*` → `${BACKEND_URL}/:path*`

---

## Middleware chain

```ts
// requireAuth
const token = req.cookies?.token;
if (!token) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
try {
  const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  req.userId    = payload.userId;
  req.userRole  = payload.role;
  req.userStatus = payload.status;
  next();
} catch {
  res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
}

// requireApproved (chain after requireAuth)
if (req.userStatus !== "APPROVED") {
  return res.status(403).json({ error: { code: "PENDING_APPROVAL", message: "Account awaiting approval" } });
}
next();

// requireAdmin (chain after requireAuth)
if (req.userRole !== "ADMIN") {
  return res.status(403).json({ error: { code: "FORBIDDEN", message: "Admin only" } });
}
next();
```

## Cookie config

```ts
res.cookie("token", jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

## JWT payload — include role + status (re-sign on admin status change)

```ts
jwt.sign({ userId: user.id, role: user.role, status: user.status }, process.env.JWT_SECRET!, { expiresIn: "7d" })
```

## Ownership pattern

```ts
// 404 (not 403) — don't leak existence of other users' tasks
const task = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
if (!task) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Task not found" } });
```

---

## Done when

- Signup → pending cookie set → GET /auth/me returns `{ status: "PENDING" }`
- Pending user: login returns 403 `PENDING_APPROVAL`; frontend shows pending screen
- Admin PATCH /admin/users/:id `{ status: "APPROVED" }` → user can now login
- Approved user: login → 200 cookie → refresh → still authenticated
- Task created by A is 404 for B
- Admin can GET /tasks?scope=all → sees all tasks
- Non-admin GET /tasks?scope=all → sees only own tasks (scope param ignored)
