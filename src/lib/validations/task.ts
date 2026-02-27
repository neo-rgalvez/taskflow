import { z } from "zod";

export const taskStatuses = ["todo", "in_progress", "waiting_on_client", "review", "done"] as const;
export const taskPriorities = ["low", "medium", "high", "urgent"] as const;

export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(500, "Task title must be 500 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(10000, "Description must be 10,000 characters or fewer.")
    .optional()
    .or(z.literal("")),
  status: z.enum(taskStatuses).default("todo"),
  priority: z.enum(taskPriorities).default("medium"),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable()
    .or(z.literal("")),
  position: z.number().int().min(0).optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(500, "Task title must be 500 characters or fewer.")
    .optional(),
  description: z
    .string()
    .trim()
    .max(10000, "Description must be 10,000 characters or fewer.")
    .optional()
    .nullable(),
  status: z.enum(taskStatuses).optional(),
  priority: z.enum(taskPriorities).optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable()
    .or(z.literal("")),
  position: z.number().int().min(0).optional(),
  updatedAt: z.string().datetime("Invalid timestamp for optimistic locking."),
});

export const updateTaskPositionSchema = z.object({
  status: z.enum(taskStatuses),
  position: z.number().int().min(0),
  updatedAt: z.string().datetime("Invalid timestamp for optimistic locking."),
});

export const createSubtaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Subtask title is required.")
    .max(500, "Subtask title must be 500 characters or fewer."),
});

export const updateSubtaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Subtask title is required.")
    .max(500, "Subtask title must be 500 characters or fewer.")
    .optional(),
  isCompleted: z.boolean().optional(),
});

export const createTimeEntrySchema = z
  .object({
    projectId: z.string().min(1, "Project is required."),
    taskId: z.string().optional().nullable(),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2,000 characters or fewer.")
      .optional()
      .or(z.literal("")),
    durationMinutes: z
      .number()
      .int("Duration must be a whole number.")
      .min(1, "Duration must be at least 1 minute.")
      .max(1440, "Duration cannot exceed 24 hours."),
    isBillable: z.boolean().default(true),
  });

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty.")
    .max(5000, "Comment must be 5,000 characters or fewer."),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskPositionInput = z.infer<typeof updateTaskPositionSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
