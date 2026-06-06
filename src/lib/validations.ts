import { z } from 'zod'

export const createInvoiceSchema = z.object({
  clientName: z.string().min(1).max(100),
  clientEmail: z.string().email(),
  amount: z.number().positive().multipleOf(0.01),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  invoiceRef: z.string().max(50).optional(),
})

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  replyToEmail: z.string().email().optional(),
})

export const checkinCancelSchema = z.object({
  token: z.string().min(1),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
