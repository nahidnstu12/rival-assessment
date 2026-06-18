## Phase 6 — Task Activity Log

> Goal: every task change is recorded with actor + diff. Shown inline at the bottom of the edit sheet. Admin edits are attributed.

---

## Model

```prisma
model TaskActivity {
  id        String   @id @default(cuid())
  taskId    String
  actorId   String   // who did it — NOT the task owner
  action    Action   // CREATED | UPDATED | STATUS_CHANGED | DELETED
  changes   Json?    // { field: { from, to } } — only for UPDATED / STATUS_CHANGED
  createdAt DateTime @default(now())

  task  Task @relation(fields: [taskId],  references: [id], onDelete: Cascade)
  actor User @relation(fields: [actorId], references: [id])

  @@index([taskId, createdAt])
}

enum Action { CREATED UPDATED STATUS_CHANGED DELETED }
```

---

## Backend

- [ ] Migration + Prisma generate
- [ ] On create: insert `{ action: CREATED, changes: null }`
- [ ] On update: diff incoming dto vs existing task; build `changes` JSON with only the fields that differ. Skip if no diff.
- [ ] On status change: use `STATUS_CHANGED` so UI can render a pill, not a list
- [ ] Wrap update + activity in `prisma.$transaction([...])` — both succeed or both fail
- [ ] Skip logging `order` changes from drag-reorder (too noisy)
- [ ] `GET /tasks/:id/activity?limit=10&cursor=...` — newest first, include `actor: { id, name, role }`

---

## Frontend

- [ ] At bottom of edit sheet: `<ActivityList taskId={...} />`
- [ ] Use TanStack Query, key: `["task", id, "activity"]`
- [ ] Render last 10; "Show more" loads next page
- [ ] Each row: actor name + role badge + action + diff lines
  - e.g. *"Sabir (Admin) changed **status**: TODO → DONE"*
  - e.g. *"You created this task"*
- [ ] Invalidate activity query after a successful update/create

---

## Diff shape (renderer contract)

```json
{
  "status":  { "from": "TODO", "to": "DONE" },
  "dueDate": { "from": "2026-06-20", "to": "2026-06-25" }
}
```

Renderer rule: one line per field. Skip null → null. Format dates as `YYYY-MM-DD`.

---

## Done when

- Create a task → activity row "You created this task"
- Edit title + due date → one row with 2 diff lines
- Admin edits user's task → row shows "Sabir (Admin) changed ..."
- Delete a task → all activity rows are gone (cascade)
- Drag-reorder a task → no new activity row
- 11th activity → "Show more" appears, loads next page

---

## Out of scope (don't build for assessment)

- No separate `/activity` page
- No notifications / email on change
- No revert-to-previous-version action
- No actor avatar (text + role badge is enough)
