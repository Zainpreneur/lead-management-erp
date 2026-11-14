import { z } from 'zod';

export const invoiceInputSchema = z.object({
  customerReference: z.string().min(1, 'Customer is required'),
  leadReference: z.string().nullable().optional(),
  proposalReference: z.string().nullable().optional(),
  status: z.string().optional().nullable(),
  subtotal: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  currency: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  paidDate: z.string().optional().nullable(),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(0),
    unitPrice: z.number().min(0),
    discountPercent: z.number().min(0).optional(),
    taxRate: z.number().min(0).optional(),
  })).optional(),
});