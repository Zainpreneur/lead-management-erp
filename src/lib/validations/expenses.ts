import { z } from 'zod';

export const expenseStatusSchema = z.enum(['pending', 'approved', 'rejected', 'paid']);

export const expenseCategorySchema = z.enum([
  'general',
  'travel',
  'meals',
  'office',
  'software',
  'marketing',
  'training',
  'asset_purchase',
  'asset_maintenance',
  'asset_disposal',
  'asset_depreciation',
  'other',
]);

export const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  category: expenseCategorySchema.optional().default('general'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).optional().default('USD'),
  status: expenseStatusSchema.optional().default('pending'),
  expenseDate: z.string().date().optional().default(() => new Date().toISOString().split('T')[0]),
  paidBy: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().url().optional().nullable(),
  vendorReference: z.string().max(50).optional().nullable(),
  assetReference: z.string().max(50).optional().nullable(),
  purchaseOrderReference: z.string().max(50).optional().nullable(),
  assetCategory: z.string().max(100).optional().nullable(),
  isAssetPurchase: z.boolean().optional().default(false),
  assetDepreciationReference: z.string().max(50).optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseFiltersSchema = z.object({
  search: z.string().optional(),
  status: expenseStatusSchema.optional(),
  category: expenseCategorySchema.optional(),
  limit: z.number().int().min(1).max(100).default(10),
  page: z.number().int().min(1).default(1),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;