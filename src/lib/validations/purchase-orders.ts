import { z } from 'zod';

export const poStatusSchema = z.enum([
  'draft',
  'submitted',
  'approved',
  'ordered',
  'received',
  'partially_received',
  'cancelled',
  'closed',
]);

export const poItemSchema = z.object({
  productReference: z.string().max(50).optional().nullable(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0).default(0),
  serialNumber: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  manufacturer: z.string().max(100).optional().nullable(),
});

export const createPOSchema = z.object({
  vendorReference: z.string().min(1, 'Vendor is required').max(50),
  status: poStatusSchema.optional().default('draft'),
  currency: z.string().length(3).optional().default('USD'),
  orderDate: z.string().date().optional().default(() => new Date().toISOString().split('T')[0]),
  expectedDelivery: z.string().date().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(poItemSchema).min(1, 'At least one item required'),
});

export const updatePOSchema = createPOSchema.partial().extend({
  status: poStatusSchema.optional(),
});

export const poFiltersSchema = z.object({
  search: z.string().optional(),
  status: poStatusSchema.optional(),
  vendorReference: z.string().max(50).optional(),
  limit: z.number().int().min(1).max(100).default(10),
  page: z.number().int().min(1).default(1),
});

export const goodsReceiptItemSchema = z.object({
  poItemId: z.number().int().positive(),
  quantityReceived: z.number().positive(),
});

export const createGoodsReceiptSchema = z.object({
  poReference: z.string().min(1).max(50),
  receivedDate: z.string().date().optional().default(() => new Date().toISOString().split('T')[0]),
  receivedBy: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(goodsReceiptItemSchema).min(1),
});

export const invoiceGateResponseSchema = z.object({
  allowed: z.boolean(),
  reason: z.string(),
  receivedValue: z.number(),
  orderedValue: z.number(),
  receivedPercent: z.number(),
});

export type CreatePOInput = z.infer<typeof createPOSchema>;
export type UpdatePOInput = z.infer<typeof updatePOSchema>;
export type POFilters = z.infer<typeof poFiltersSchema>;
export type CreateGoodsReceiptInput = z.infer<typeof createGoodsReceiptSchema>;
export type InvoiceGateResponse = z.infer<typeof invoiceGateResponseSchema>;