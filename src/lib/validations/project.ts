import { z } from "zod";

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
    status: z.enum(["active", "on_hold", "completed", "cancelled"]).default("active"),
    billingType: z.enum(["hourly", "fixed_price"], {
      message: "Please select a billing type.",
    }),
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
      .int("Budget hours must be a whole number.")
      .positive("Budget hours must be a positive number.")
      .max(99999, "Budget hours is too large.")
      .optional()
      .nullable(),
    deadline: z
      .string()
      .datetime({ offset: true })
      .optional()
      .nullable()
      .or(z.literal("")),
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
    clientId: z.string().min(1, "Client is required.").optional(),
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
    status: z.enum(["active", "on_hold", "completed", "cancelled"]).optional(),
    billingType: z.enum(["hourly", "fixed_price"]).optional(),
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
      .int("Budget hours must be a whole number.")
      .positive("Budget hours must be a positive number.")
      .max(99999, "Budget hours is too large.")
      .optional()
      .nullable(),
    deadline: z
      .string()
      .datetime({ offset: true })
      .optional()
      .nullable()
      .or(z.literal("")),
    updatedAt: z.string().datetime("Invalid timestamp for optimistic locking."),
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
