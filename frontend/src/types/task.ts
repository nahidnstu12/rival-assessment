export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type TaskOwner = {
  id: string;
  name: string;
  email: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  order: number;
  userId: string;
  owner?: TaskOwner;
  createdAt: string;
  updatedAt: string;
};

export type TaskListResponse = {
  data: Task[];
  page: number;
  limit: number;
  total: number;
  counts: {
    all: number;
    todo: number;
    in_progress: number;
    done: number;
  };
};

export type TaskListParams = {
  scope?: "mine" | "all";
  status?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "PENDING" | "APPROVED" | "REJECTED";
  taskCount: number;
  createdAt: string;
};
