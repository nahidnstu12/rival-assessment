import { z } from "zod";

export const userStatusUpdateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
});

export type UserStatusUpdateInput = z.infer<typeof userStatusUpdateSchema>;
