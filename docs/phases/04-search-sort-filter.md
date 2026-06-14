# Phase 4 — Search, Sort & Filter

> Goal: All filters + search + sort live in the URL. Manual drag-to-reorder is the default sort. All options compose with single GET /tasks call.

---

## Sort options (from design dropdown)

| UI label | URL param | Backend |
|----------|-----------|---------|
| Manual order (default) | `sort=manual` | `ORDER BY order ASC` |
| Newest first | `sort=createdAt&order=desc` | `ORDER BY createdAt DESC` |
| Oldest first | `sort=createdAt&order=asc` | `ORDER BY createdAt ASC` |
| Due date ↑ | `sort=dueDate&order=asc` | `ORDER BY dueDate ASC` |
| Due date ↓ | `sort=dueDate&order=desc` | `ORDER BY dueDate DESC` |
| Priority ↓ | `sort=priority&order=desc` | map LOW/MEDIUM/HIGH to 1/2/3 |
| Priority ↑ | `sort=priority&order=asc` | same, reversed |

> "Manual order" is My tasks only. "All tasks" (admin) defaults to `sort=createdAt&order=desc`.

---

## Checklist

- [x] Status pills: All / To do / In progress / Done — each shows count of scoped tasks
- [x] Search input in topbar — debounced 220ms → `?search=foo`
- [x] Sort dropdown — changes `?sort=...&order=...`
- [x] Changing status or sort resets `?page=1`
- [x] Drag hint chip ("Drag rows to reorder") visible only when `sort=manual` on My tasks view
- [x] "Clear filters" button resets search + status (appears in empty state only)
- [x] All params survive page refresh
- [x] Disable sort dropdown while query is fetching

---

## `useTaskFilters` hook

```ts
export function useTaskFilters() {
  const params   = useSearchParams();
  const router   = useRouter();
  const pathname = usePathname();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    value ? next.set(key, value) : next.delete(key);
    if (key !== "page") next.set("page", "1");
    router.replace(`${pathname}?${next.toString()}`);
  }

  return {
    status: params.get("status") ?? "all",
    search: params.get("search") ?? "",
    sort:   params.get("sort")   ?? "manual",
    order:  (params.get("order") ?? "asc") as "asc" | "desc",
    page:   Number(params.get("page") ?? 1),
    setParam,
    clearFilters: () => {
      router.replace(pathname);        // drops all params
    },
  };
}
```

## `useTasks` hook

```ts
export function useTasks(scope: "mine" | "all" = "mine") {
  const { status, search, sort, order, page } = useTaskFilters();
  return useQuery({
    queryKey: ["tasks", { scope, status, search, sort, order, page }],
    queryFn: () => tasksApi.list({ scope, status, search, sort, order, page }),
    placeholderData: keepPreviousData,
  });
}
```

## Debounced search

```ts
// Topbar search input — local state, debounce writes to URL
const [local, setLocal] = useState(search);
useEffect(() => {
  const t = setTimeout(() => setParam("search", local || null), 220);
  return () => clearTimeout(t);
}, [local]);
```

## Backend priority sort (Prisma workaround)

Prisma can't `ORDER BY` an enum value directly. Use a raw query or fetch + sort in-memory for priority:

```ts
// Option A: raw SQL (preferred for pagination accuracy)
const tasks = await prisma.$queryRaw`
  SELECT *, CASE priority WHEN 'LOW' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'HIGH' THEN 3 END as prio_val
  FROM "Task"
  WHERE "userId" = ${userId}
  ORDER BY prio_val ${order === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`}
  LIMIT ${limit} OFFSET ${skip}
`;
```

---

## Done when

- URL at `?status=TODO&search=wire&sort=dueDate&order=asc&page=1` loads exact subset
- `sort=manual` shows drag handles; any other sort removes them
- Status pills show live counts matching current scope
- Browser back/forward preserves filter history
- `keepPreviousData` keeps previous page visible during page change
- Admin "All tasks" view: no manual sort option in dropdown
