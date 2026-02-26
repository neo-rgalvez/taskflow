import { z } from "zod";

export const projectStatusEnum = z.enum([
  "active",
  "on_hold",
  "completed",
  "cancelled",
]);

export const billingTypeEnum = z.enum(["hourly", "fixed_price"]);

export const createProjectSchema = z
  .object({
    clientId: z.string().min(1, "Client is required."),
    name: z
      .string()
      .trim()
      .min(1, "Project name is required.")
      .max(200, "Project name must be 200 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or fewer.")
      .optional()
      .or(z.literal("")),
    billingType: billingTypeEnum,
    hourlyRate: z
      .number()
      .positive("Hourly rate must be a positive number.")
      .max(99999999.99, "Hourly rate is too large.")
      .optional()
      .nullable(),
    fixedPrice: z
      .number()
      .positive("Total price must be a positive number.")
      .max(99999999.99, "Total price is too large.")
      .optional()
      .nullable(),
    budgetHours: z
      .number()
      .min(0, "Budget hours must be a positive number.")
      .max(99999.99, "Budget hours is too large.")
      .optional()
      .nullable(),
    budgetAmount: z
      .number()
      .min(0, "Budget amount must be a positive number.")
      .max(99999999.99, "Budget amount is too large.")
      .optional()
      .nullable(),
    deadline: z
      .string()
      .optional()
      .nullable(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.billingType === "hourly" && !data.hourlyRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hourly rate is required for hourly projects.",
        path: ["hourlyRate"],
      });
    }
    if (data.billingType === "fixed_price" && !data.fixedPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total price is required for fixed-price projects.",
        path: ["fixedPrice"],
      });
    }
  });

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name is required.")
      .max(200, "Project name must be 200 characters or fewer.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or fewer.")
      .optional()
      .or(z.literal("")),
    status: projectStatusEnum.optional(),
    billingType: billingTypeEnum.optional(),
    hourlyRate: z
      .number()
      .positive("Hourly rate must be a positive number.")
      .max(99999999.99, "Hourly rate is too large.")
      .optional()
      .nullable(),
    fixedPrice: z
      .number()
      .positive("Total price must be a positive number.")
      .max(99999999.99, "Total price is too large.")
      .optional()
      .nullable(),
    budgetHours: z
      .number()
      .min(0, "Budget hours must be a positive number.")
      .max(99999.99, "Budget hours is too large.")
      .optional()
      .nullable(),
    budgetAmount: z
      .number()
      .min(0, "Budget amount must be a positive number.")
      .max(99999999.99, "Budget amount is too large.")
      .optional()
      .nullable(),
    deadline: z
      .string()
      .optional()
      .nullable(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color.")
      .optional(),
    updatedAt: z.string().datetime("Invalid timestamp for optimistic locking."),
  });

// Status transition rules
const allowedTransitions: Record<string, string[]> = {
  active: ["on_hold", "completed", "cancelled"],
  on_hold: ["active", "cancelled"],
  completed: ["active"],
  cancelled: [], // Cancelled is terminal
};

export function validateStatusTransition(
  from: string,
  to: string
): string | null {
  if (from === to) return null;
  const allowed = allowedTransitions[from];
  if (!allowed || !allowed.includes(to)) {
    if (from === "cancelled") {
      return "Cancelled projects cannot be reopened. Create a new project.";
    }
    return `Cannot change status from ${from} to ${to}.`;
  }
  return null;
}

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
