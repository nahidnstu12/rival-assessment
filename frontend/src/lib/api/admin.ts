import { api } from "@/lib/api";
import type { AdminUser } from "@/types/task";

export const adminApi = {
  users: () => api<{ users: AdminUser[] }>("/admin/users"),
  updateUserStatus: (id: string, status: "PENDING" | "APPROVED" | "REJECTED") =>
    api<{ user: AdminUser }>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
