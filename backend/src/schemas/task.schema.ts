import { z } from "zod";

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD")
    .optional()
    .nullable(),
  order: z.number().int().optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const taskListQuerySchema = z.object({
  status: z.enum(["all", "todo", "in_progress", "done"]).optional(),
  search: z.string().trim().max(255).optional(),
  sort: z.enum(["manual", "priority", "dueDate", "createdAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  scope: z.enum(["mine", "all"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskListQueryInput = z.infer<typeof taskListQuerySchema>;
