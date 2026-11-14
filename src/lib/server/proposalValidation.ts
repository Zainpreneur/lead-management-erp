import { z } from 'zod';
export const proposalInputSchema = z.object({
  leadReference: z.string().nullable().optional(),
  customerReference: z.string().nullable().optional(),
  title: z.string().min(1),
  status: z.string().optional(),
  subtotal: z.number().min(0).optional(),
  discountType: z.string().nullable().optional(),
  discountValue: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  currency: z.string().optional(),
  validUntil: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(z.object({ description: z.string().min(1), quantity: z.number().min(0), unitPrice: z.number().min(0) })).optional(),
});
