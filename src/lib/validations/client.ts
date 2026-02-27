import { z } from "zod";

export const createClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Client name is required.")
    .max(200, "Client name is too long."),
  contactName: z
    .string()
    .trim()
    .max(200, "Contact name must be 200 characters or fewer.")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .max(254, "Email must be 254 characters or fewer.")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(50, "Phone must be 50 characters or fewer.")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(1000, "Address is too long.")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(5000, "Notes are too long.")
    .optional()
    .or(z.literal("")),
  defaultHourlyRate: z
    .number()
    .min(0, "Hourly rate must be a positive number.")
    .max(99999999.99, "Hourly rate is too large.")
    .optional()
    .nullable(),
  defaultPaymentTerms: z
    .number()
    .int("Payment terms must be a whole number of days.")
    .positive("Payment terms must be a positive number of days.")
    .max(365, "Payment terms cannot exceed 365 days.")
    .optional()
    .nullable(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  updatedAt: z.string().datetime("Invalid timestamp for optimistic locking."),
});

export const archiveClientSchema = z.object({
  isArchived: z.boolean(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
