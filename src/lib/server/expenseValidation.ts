import { z } from 'zod';
export const expenseInputSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  amount: z.number().min(0),
  currency: z.string().optional(),
  status: z.string().optional(),
  expenseDate: z.string().optional(),
  paidBy: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
});
