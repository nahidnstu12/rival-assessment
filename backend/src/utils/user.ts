import type { User } from "@prisma/client";

export function serializeUser(user: Pick<User, "id" | "name" | "email" | "role" | "status">) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}
