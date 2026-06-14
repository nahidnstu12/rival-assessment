# Phase 5 — Tests, Bonuses & Deploy

> Goal: ≥3 meaningful tests passing. 2 bonuses shipped. Live link verified end-to-end.

---

## Checklist

### Tests (required ≥3)
- [x] **API test 1:** User A cannot read User B's task → 404 (not 403; don't leak existence)
- [x] **API test 2:** `POST /tasks` missing title → 400 with correct error envelope shape
- [x] **UI test 1:** TaskForm shows "Title is required" when submitted empty
- [ ] Stretch: list renders skeleton (loading), empty state, error state with RTL

### Bonuses (do in order)
- [x] **Optimistic UI** — delete/complete update UI before server confirms; rollback on error
- [x] **Dark mode** — `next-themes` toggle, persisted in localStorage
- [x] **CI** — GitHub Actions: `bun test` on push to `main`
- [x] **Docker** — `docker-compose.yml` spins up Postgres locally

### Deploy
- [ ] Neon DB created → `DATABASE_URL` copied
- [ ] Backend on Render: env vars set, `bun run build && bun start`, migrations run (`bun run db:deploy`)
- [ ] Frontend on Vercel: `BACKEND_URL` = Render URL, rewrites in `next.config.ts` active
- [ ] Cookie flags verified in prod: `Secure: true`, `SameSite: Lax`
- [ ] E2E smoke: signup → login → refresh (still logged in) → create task → edit → delete → logout
- [x] README setup steps tested from scratch (clone → run)
- [ ] Submit email to `sabir@rival.io`: GitHub URL + live link

### README sections
- [x] Prerequisites (Node 20, Bun, Postgres or Neon account)
- [x] Setup steps: `cp .env.example .env`, fill vars, `prisma migrate dev`, `bun run dev`
- [x] Assumptions & Trade-offs section (pull from plan §1)
- [x] Architecture diagram (ASCII from plan §2)

---

## Test setup (Vitest + supertest)

```ts
// backend/src/__tests__/tasks.test.ts
describe("task ownership", () => {
  it("returns 404 when user A reads user B task", async () => {
    const { token: tokenA } = await createUserAndLogin("a@test.com");
    const { token: tokenB, userId: userBId } = await createUserAndLogin("b@test.com");
    const task = await prisma.task.create({ data: { title: "B task", userId: userBId } });

    const res = await request(app)
      .get(`/tasks/${task.id}`)
      .set("Cookie", `token=${tokenA}`);

    expect(res.status).toBe(404);
  });
});
```

## Optimistic delete pattern

```ts
useMutation({
  mutationFn: (id: string) => tasksApi.delete(id),
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ["tasks"] });
    const prev = queryClient.getQueryData(["tasks", filters]);
    queryClient.setQueryData(["tasks", filters], (old: TaskList) => ({
      ...old,
      data: old.data.filter((t) => t.id !== id),
    }));
    return { prev };
  },
  onError: (_err, _id, ctx) => {
    queryClient.setQueryData(["tasks", filters], ctx?.prev);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
});
```

---

## Done when

- `npm test` exits 0 with ≥3 tests
- Live link: signup → CRUD → refresh stays logged in
- GitHub repo public with clean commit history
- Email sent with both links
