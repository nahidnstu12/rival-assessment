import { api } from "@/lib/api";
import type { User } from "@/types/user";

export type LoginInput = { email: string; password: string };
export type SignupInput = { name: string; email: string; password: string };

export const authApi = {
  me: () => api<{ user: User | null }>("/auth/me"),
  login: (data: LoginInput) =>
    api<{ user: User; pendingApproval?: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  signup: (data: SignupInput) =>
    api<{ user: User; pendingApproval: boolean }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => api<void>("/auth/logout", { method: "POST" }),
};
