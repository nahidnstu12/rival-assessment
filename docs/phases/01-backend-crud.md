# Phase 1 — Backend CRUD

> Goal: Express API is Postman-green. No auth yet. All task + admin-user endpoints work with correct validation, status codes, and error envelope.

---

## Scaffold

```
backend/
  src/
    index.ts
    router.ts
    db.ts                     # Prisma singleton
    middleware/
      errorHandler.ts         # global → error envelope
      validate.ts             # Zod middleware factory
    routes/
      tasks.ts
      admin.ts                # user management (admin only, wired in Phase 2)
    schemas/
      task.schema.ts
      user.schema.ts
  prisma/
    schema.prisma
  .env
  .env.example
  package.json
  tsconfig.json
```

---

## Prisma schema

```prisma
enum Role       { USER ADMIN }
enum UserStatus { PENDING APPROVED REJECTED }
enum Status     { TODO IN_PROGRESS DONE }
enum Priority   { LOW MEDIUM HIGH }

model User {
  id        String     @id @default(cuid())
  name      String
  email     String     @unique
  password  String
  role      Role       @default(USER)
  status    UserStatus @default(PENDING)
  tasks     Task[]
  createdAt DateTime   @default(now())
}

model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      Status    @default(TODO)
  priority    Priority  @default(MEDIUM)
  dueDate     DateTime?
  order       Int       @default(0)   // manual drag-to-reorder
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## Checklist

- [ ] `npm init`, install: `express`, `@prisma/client`, `prisma`, `zod`, `dotenv`, `cors`, `cookie-parser`
- [ ] Dev deps: `typescript`, `ts-node-dev`, `@types/express`, `@types/node`
- [ ] `tsconfig.json` — `target: ES2022`, `strict: true`
- [ ] Schema above → `npx prisma migrate dev --name init`
- [ ] `db.ts` — singleton `new PrismaClient()`
- [ ] Global error handler — returns `{ error: { code, message, details? } }` on all non-2xx
- [ ] Zod validate middleware factory
- [ ] **POST /tasks** — create, owner set from `req.userId` (hardcoded stub user in Phase 1), 201
- [ ] **GET /tasks** — list scoped to userId, offset pagination, status filter, manual sort (`ORDER BY order ASC`)
- [ ] **GET /tasks/:id** — 404 if missing or not owner
- [ ] **PATCH /tasks/:id** — partial update incl. `order`, 404 if not owner
- [ ] **DELETE /tasks/:id** — 204, 404 if not owner
- [ ] **GET /admin/users** — returns all users + task count per user (stub admin check for now)
- [ ] **PATCH /admin/users/:id** — `{ status: "APPROVED"|"REJECTED" }`, 200
- [ ] **GET /tasks?scope=all** — admin-only: no userId filter (stub for now, enforce in Phase 2)
- [ ] Smoke test all endpoints in Postman

---

## Error envelope (enforce on every non-2xx)

```ts
res.status(400).json({
  error: { code: "VALIDATION_ERROR", message: "Title is required", details: issues }
});
```

## Key patterns

```ts
// Zod validate middleware
router.post("/tasks", validate(taskCreateSchema), createTask);

// Pagination
const page  = Number(req.query.page)  || 1;
const limit = Number(req.query.limit) || 6;  // matches design PER_PAGE
const skip  = (page - 1) * limit;

// Manual sort (default)
const sort = req.query.sort ?? "manual";
const orderBy = sort === "manual"
  ? { order: "asc" as const }
  : sort === "dueDate"   ? { dueDate: dir }
  : sort === "priority"  ? { priority: dir }
  : { createdAt: dir };

// Response shape
res.json({ data: tasks, page, limit, total });

// Admin GET /tasks?scope=all
const where = isAdmin && req.query.scope === "all"
  ? filters
  : { ...filters, userId: req.userId };
```

---

## Done when

- All 5 task endpoints green in Postman with correct status codes
- Missing task → 404; bad body → 400 with envelope shape
- `?page=2&limit=6` returns correct slice + total
- `?sort=manual` returns tasks ordered by `order ASC`
- GET /admin/users returns users with task count
- PATCH /admin/users/:id updates status field
