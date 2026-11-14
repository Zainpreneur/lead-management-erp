import { z } from 'zod';
export const paymentInputSchema = z.object({
  invoiceReference: z.string().min(1),
  amount: z.number().min(0),
  method: z.string().optional(),
  status: z.string().optional(),
  paidAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
