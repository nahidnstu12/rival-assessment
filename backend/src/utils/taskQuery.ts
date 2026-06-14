import type { Priority, Prisma, Status, Task } from "@prisma/client";

const PRIORITY_RANK: Record<Priority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

export type TaskListQuery = {
  userId: string;
  isAdmin: boolean;
  status?: string;
  search?: string;
  sort?: string;
  order?: string;
  scope?: string;
  page?: string;
  limit?: string;
};

export function parseListParams(query: TaskListQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 6));
  const skip = (page - 1) * limit;
  const sort = query.sort ?? "manual";
  const order: "asc" | "desc" = query.order === "asc" ? "asc" : "desc";

  const where: Prisma.TaskWhereInput = {};

  if (!(query.isAdmin && query.scope === "all")) {
    where.userId = query.userId;
  }

  if (query.status && query.status !== "all") {
    where.status = query.status.toUpperCase() as Status;
  }

  if (query.search?.trim()) {
    where.title = { contains: query.search.trim(), mode: "insensitive" };
  }

  return { page, limit, skip, sort, order, where };
}

/** Where clause for counts — same scope/search, no status filter */
export function buildCountWhere(query: TaskListQuery): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {};
  if (!(query.isAdmin && query.scope === "all")) {
    where.userId = query.userId;
  }
  if (query.search?.trim()) {
    where.title = { contains: query.search.trim(), mode: "insensitive" };
  }
  return where;
}

export async function getStatusCounts(
  count: (args: Prisma.TaskCountArgs) => Promise<number>,
  baseWhere: Prisma.TaskWhereInput,
) {
  const [all, todo, in_progress, done] = await Promise.all([
    count({ where: baseWhere }),
    count({ where: { ...baseWhere, status: "TODO" } }),
    count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
    count({ where: { ...baseWhere, status: "DONE" } }),
  ]);
  return { all, todo, in_progress, done };
}

export async function listTasks(
  findMany: (args: Prisma.TaskFindManyArgs) => Promise<Task[]>,
  count: (args: Prisma.TaskCountArgs) => Promise<number>,
  params: ReturnType<typeof parseListParams>,
) {
  const { page, limit, skip, sort, order, where } = params;

  if (sort === "priority") {
    const all: Task[] = await findMany({ where });
    all.sort((a, b) => {
      const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      return order === "asc" ? diff : -diff;
    });
    return { data: all.slice(skip, skip + limit), page, limit, total: all.length };
  }

  const orderBy = buildOrderBy(sort, order);
  const [data, total] = await Promise.all([
    findMany({ where, orderBy, skip, take: limit }),
    count({ where }),
  ]);

  return { data, page, limit, total };
}

function buildOrderBy(sort: string, order: "asc" | "desc"): Prisma.TaskOrderByWithRelationInput {
  if (sort === "manual") return { order: "asc" };
  if (sort === "dueDate") return { dueDate: order };
  if (sort === "createdAt") return { createdAt: order };
  return { createdAt: "desc" };
}

export function serializeTask(
  task: Task & { user?: { id: string; name: string; email: string } | null },
) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString().slice(0, 10) ?? null,
    order: task.order,
    userId: task.userId,
    owner: task.user
      ? { id: task.user.id, name: task.user.name, email: task.user.email }
      : undefined,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function parseDueDate(value?: string | null) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}
