## Phase 8 — Real-time Updates (SSE)

> Goal: push task / activity / user changes to connected clients via Server-Sent Events. One endpoint, two channels (per-user + admin). Client refetches on event — never merges payloads.

---

## Why SSE, not WebSocket

- One-way push is all we need — mutations stay on REST
- `EventSource` sends cookies automatically → existing `requireAuth` middleware works as-is
- Built-in auto-reconnect handles Render cold starts
- Same `/api/*` proxy path — no new infra, no CORS surprises

---

## Architecture

```
[ Client ] ──EventSource──► /api/events ──► [ Express ] ──in-memory pub/sub──► route handlers
                                                  │
                                                  ├── Map<userId, Subscriber[]>   // per-user channel
                                                  └── Set<Subscriber>             // admin channel
```

No new tables. No Redis. In-memory only for assessment scale.

---

## Event types

| Event | Triggered by | Recipients |
|---|---|---|
| `task.created` | `POST /tasks` | owner + admins |
| `task.updated` | `PATCH /tasks/:id` | owner + admins |
| `task.deleted` | `DELETE /tasks/:id` | owner + admins |
| `task.activity.added` | any task write / attachment change | owner + admins |
| `attachment.added` / `attachment.removed` | attachment routes | owner + admins |
| `user.approved` / `user.rejected` | `PATCH /admin/users/:id` | target user + all admins |

Payload shape — small, no full bodies:

```json
{ "type": "task.updated", "taskId": "cuid...", "actorId": "cuid...", "ts": 1718600000000 }
```

---

## Backend checklist

- [ ] `GET /api/events` — protected by `requireAuth + requireApproved`
- [ ] Set headers and flush:
  ```ts
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders()
  ```
- [ ] On connect: register `{ userId, role, res }` in subscriber maps
- [ ] On `req.on("close")`: remove subscriber (no leaks)
- [ ] **Heartbeat every 15 s** — write `: ping\n\n` to keep Render proxy from killing the connection
- [ ] `emit(event, { ownerId })` helper — fans to `subscribers.get(ownerId) || []` + admin set
- [ ] Wire emits into: task create / update / delete, activity insert, attachment add / remove, user approve / reject
- [ ] **Emit AFTER the DB transaction commits** — never emit on a failed write
- [ ] Same `actorId` from JWT used in TaskActivity goes into the event payload

---

## Frontend checklist

- [ ] `useEventStream()` hook mounted in app shell, **after login only**
- [ ] One `EventSource("/api/events")` per tab
- [ ] On message → switch on `type` → invalidate TanStack Query keys:
  - `task.*` → `["tasks"]` + `["task", id]` if mine
  - `task.activity.added` → `["task", id, "activity"]`
  - `attachment.*` → `["task", id, "attachments"]` + `["task", id, "activity"]`
  - `user.approved` → `["users"]` + refetch `me`
- [ ] Close the stream on logout
- [ ] Optional: tiny "reconnecting…" badge on `EventSource.readyState === CONNECTING`

---

## The core rule: **invalidate, don't merge**

The event payload carries IDs only. Client refetches via REST.

- Server is the source of truth
- No merge-conflict logic on the client
- No "stale event for new state" race
- One bug fewer per feature

---

## Done when

- Tab A edits a task → Tab B (same user) refreshes the row within ~1 s
- Admin approves a pending user in `/users` → user's pending screen flips to `/tasks` live
- Admin viewing `/tasks/all` sees a new task from any user appear
- Kill backend → frontend shows reconnecting → backend back → events resume, no manual refresh
- Logout → stream closes, no zombie connection
- 15 s of idle → no disconnect (heartbeat keeps it alive)

---

## Trade-offs (interview-ready)

1. **SSE over WebSocket** — one-way is enough; cookie auth and reconnect are free
2. **Invalidate-not-merge** — server is truth; refetch is fast; no merge bugs
3. **In-memory pub/sub** — single Render instance is fine for assessment; Redis pub/sub for horizontal scale
4. **15 s heartbeat** — Render free tier kills idle HTTP; ping avoids it
5. **Per-user scoping** — events fan only to owner + admins; never leak across users
6. **Emit after commit** — events follow successful writes only, no ghost notifications

---

## Out of scope

- Presence ("who's online")
- Typing indicators
- Redis adapter for multi-instance
- Per-event delta merging on the client
- Reconnect backoff tuning
- Notification badges on tab title / favicon
- Read receipts
