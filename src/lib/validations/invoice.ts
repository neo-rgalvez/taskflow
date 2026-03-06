import { z } from "zod";

export const createInvoiceSchema = z.object({
  projectId: z.string().min(1, "Project is required."),
  clientId: z.string().min(1, "Client is required."),
  dueDate: z.string().min(1, "Due date is required."),
  subtotal: z.number().min(0, "Subtotal must be non-negative."),
  taxRate: z.number().min(0).max(100).optional().default(0),
  notes: z.string().max(50000, "Notes are too long.").optional().or(z.literal("")),
  paymentInstructions: z
    .string()
    .max(50000, "Payment instructions are too long.")
    .optional()
    .or(z.literal("")),
});

export const updateInvoiceSchema = z.object({
  status: z
    .enum(["draft", "sent", "paid", "overdue", "partial"])
    .optional(),
  dueDate: z.string().optional(),
  subtotal: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  notes: z.string().max(50000).optional().or(z.literal("")),
  paymentInstructions: z.string().max(50000).optional().or(z.literal("")),
  updatedAt: z.string().datetime("Invalid timestamp for optimistic locking."),
});

export const recordPaymentSchema = z.object({
  amount: z
    .number()
    .positive("Payment amount must be positive."),
  paymentDate: z.string().min(1, "Payment date is required."),
  method: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
