import { z } from 'zod';

export const invoiceStatusSchema = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'void']);

export const invoiceLineItemSchema = z.object({
  productReference: z.string().max(50).optional().nullable(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).default(0),
});

export const createInvoiceSchema = z.object({
  customerReference: z.string().min(1, 'Customer is required').max(50),
  leadReference: z.string().max(50).optional().nullable(),
  proposalReference: z.string().max(50).optional().nullable(),
  status: invoiceStatusSchema.optional().default('draft'),
  subtotal: z.number().min(0).optional().default(0),
  taxAmount: z.number().min(0).optional().default(0),
  discountAmount: z.number().min(0).optional().default(0),
  totalAmount: z.number().min(0).optional().default(0),
  currency: z.string().length(3).optional().default('USD'),
  issueDate: z.string().date().optional().default(() => new Date().toISOString().split('T')[0]),
  dueDate: z.string().date().optional().default(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }),
  paidDate: z.string().date().optional().nullable(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  lineItems: z.array(invoiceLineItemSchema).min(1, 'At least one line item required').optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const invoiceFiltersSchema = z.object({
  search: z.string().optional(),
  status: invoiceStatusSchema.optional(),
  customerReference: z.string().max(50).optional(),
  limit: z.number().int().min(1).max(100).default(10),
  page: z.number().int().min(1).default(1),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;