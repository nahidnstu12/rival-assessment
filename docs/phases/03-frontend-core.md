# Phase 3 — Frontend Core

> Goal: Full app shell matching the approved design — sidebar layout, auth screens, task list with drag-to-reorder, task modal, admin views, pending screen.

---

## Folder structure

```
frontend/src/
  app/
    (auth)/
      login/page.tsx
      signup/page.tsx
      layout.tsx              # redirect if already authed + approved
    (app)/
      layout.tsx              # AppShell (sidebar + topbar) + AuthProvider + QueryClientProvider
      tasks/page.tsx          # TaskListPage (My tasks)
      tasks/all/page.tsx      # AllTasksPage (admin only)
      users/page.tsx          # UsersPage (admin only)
    layout.tsx                # root — ThemeProvider
    proxy.ts
  components/
    layout/
      Sidebar.tsx             # 248px, collapses mobile <720px
      Topbar.tsx              # sticky, search + new task btn
    task/
      TaskRow.tsx             # row with drag handle, checkbox, badges, actions
      TaskList.tsx            # task-list wrapper + drag wiring
      TaskModal.tsx           # create + edit (shared)
      TaskSkeleton.tsx        # 6 skeleton rows
      Pagination.tsx
      EmptyState.tsx
      Toolbar.tsx             # status pills + sort dropdown
    admin/
      UserRow.tsx
      StatsCards.tsx          # 4 metric cards
    ui/                       # shadcn components
    theme/
      ThemeToggle.tsx
    PendingScreen.tsx         # "Account under review" full-page
    Toast.tsx                 # bottom-center toast
  lib/
    api.ts                    # base fetch wrapper
    api/
      tasks.ts
      auth.ts
      admin.ts
  hooks/
    useTasks.ts
    useTaskMutations.ts
    useTaskFilters.ts
    useAdminUsers.ts
    useDragReorder.ts
  schemas/
    task.schema.ts
  types/
    task.ts                   # Task, Status, Priority, User, UserStatus
  context/
    AuthContext.tsx
  middleware.ts
```

---

## Checklist

### Layout & shell
- [x] `AppShell` — CSS Grid `248px 1fr`, sidebar + main; hides sidebar on `<720px`
- [x] `Sidebar` — logo, "My tasks" nav (count badge), admin section (Users, All tasks) shown only if `isAdmin`, user info footer, dark/light toggle, sign out
- [x] `Topbar` — sticky, frosted glass (`backdrop-filter: blur`), title + subtitle, search input (hidden on Users view), "New task" button (hidden on admin views)
- [x] Pending count badge on Users nav item: red if `> 0`
- [x] Active nav item: accent-soft background + accent color

### Auth screens (split-screen)
- [x] Left panel: purple gradient brand panel (hidden on `<860px` mobile)
- [x] Right panel: Login card — email + password, inline validation, error banner
- [x] Register card ("Request access") — name + email + password + confirm password
- [x] Toggle between login / register cards
- [x] Signup success: show pending screen immediately (status = PENDING from cookie)
- [x] Login with pending account: frontend catches `PENDING_APPROVAL` error → redirect to `/pending` or show pending screen

### Pending screen (`PendingScreen`)
- [x] Step tracker: ✓ Account created → ⏱ Waiting for approval → ○ Start creating tasks
- [x] No access to sidebar nav items (pointer-events disabled)
- [x] Sign out button still works

### Task list (My tasks)
- [x] Fetch via `useTasks()` — React Query, keyed on filters
- [x] `TaskSkeleton` — 6 rows while loading
- [x] `EmptyState` — two variants: no tasks ever (+ "New task" CTA) vs filtered empty (+ "Clear filters")
- [x] Error state — retry button
- [x] Task rows: drag handle + checkbox + title + desc + priority badge + status badge + due date (red if overdue) + hover row actions (edit, delete)
- [x] Done task: strikethrough title, green checkbox
- [x] "New task" button → open `TaskModal` in create mode

### Task modal (create + edit)
- [x] Fields: title (required), description (optional), status select, priority select, due date
- [x] Status + priority side-by-side (`grid-template-columns: 1fr 1fr`)
- [x] RHF + Zod, inline "Title is required" error
- [x] Submit disabled + loading spinner while pending mutation
- [x] On success: `queryClient.invalidateQueries(["tasks"])` + close modal
- [x] Edit mode: pre-fill fields from task data, button says "Save changes"
- [x] Esc key + backdrop click → close

### Task mutations
- [x] Create → POST + invalidate
- [x] Edit → PATCH + invalidate
- [x] Delete → `confirm()` dialog → DELETE + invalidate
- [x] Toggle complete → PATCH `{ status: status === "DONE" ? "TODO" : "DONE" }` — one click

### Drag to reorder (`useDragReorder`)
- [x] Only active on "My tasks" view + "Manual order" sort selected
- [x] HTML5 drag API: `dragstart`, `dragover`, `drop`, `dragend`
- [x] Visual: dragging row → 40% opacity; drop target → 2px accent top/bottom border
- [x] On drop: calculate new order values → PATCH /tasks/:id `{ order: newOrder }`
- [x] Drag handle icon: 3×2 dot grid (`.drag-handle`), visible on row hover

### Admin: Users page
- [x] 4 stats cards: Total users, Pending (count), Approved, Rejected
- [x] "Pending requests" section — `UserRow` with Approve + Reject buttons
- [x] "All caught up" empty state if no pending
- [x] "All members" section — Approve/Revoke/Re-approve actions (not shown for admin users)
- [x] Approve/Reject calls `PATCH /api/admin/users/:id` → invalidate users query + show toast

### Admin: All tasks page
- [x] Same task list component, fetched with `?scope=all`
- [x] Task rows show owner pill (avatar + first name) in meta area
- [x] No drag-to-reorder (only on "My tasks")
- [x] No "New task" button in topbar for this view

### Toast
- [x] Bottom-center, dark background, green checkmark icon
- [x] Auto-dismiss after 2.2s
- [x] Messages: "Task created", "Changes saved", "Task deleted", "Order updated", "{Name} approved", etc.

### Responsive
- [x] `<720px`: sidebar hidden, topbar padding reduced, search narrows to 150px
- [x] `<860px`: auth brand panel hidden (form only)
- [ ] Test at 375px: no horizontal overflow

---

## Shared Zod schema

```ts
// schemas/task.schema.ts
export const taskSchema = z.object({
  title:       z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  status:      z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority:    z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate:     z.string().optional().nullable(),
});
```

## Design tokens (CSS vars — match exactly)

```
--accent: #6E56CF  (dark: #8B73E6)
--radius: 11px, --radius-sm: 8px
--sidebar-w: 248px
Priority badges: HIGH=red-soft/red, MEDIUM=amber-soft/amber, LOW=green-soft/green
Status badges:   TODO=surface-2/muted, IN_PROGRESS=blue-soft/blue, DONE=green-soft/green
```

---

## Done when

- Login → sidebar renders with correct user name + role label
- Admin user sees "Administration" section in sidebar; regular user does not
- Pending user sees pending screen, cannot access task list
- Admin approves pending user (Users page) → toast → count badge updates
- Can create, edit, mark complete, delete tasks
- Drag to reorder works on My tasks + Manual sort
- All tasks (admin) shows owner pills
- Dark mode toggle persists across refresh
- 375px mobile: no broken layout
