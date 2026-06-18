import { z } from "zod";

export const activityListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().trim().min(1).optional(),
});

export type ActivityListQueryInput = z.infer<typeof activityListQuerySchema>;
