import { z } from 'zod';

export const assetStatusSchema = z.enum(['acquired', 'deployed', 'maintaining', 'disposed', 'lost']);
export const depreciationMethodSchema = z.enum(['straight_line', 'declining_balance', 'units_of_production']);
export const disposalMethodSchema = z.enum(['sale', 'scrap', 'donation', 'trade_in']);

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  categoryId: z.number().int().positive().optional().nullable(),
  status: assetStatusSchema.optional().default('acquired'),
  purchasePrice: z.number().min(0).optional().default(0),
  currency: z.string().length(3).optional().default('USD'),
  purchaseDate: z.string().date().optional().nullable(),
  purchaseOrderReference: z.string().max(50).optional().nullable(),
  expenseReference: z.string().max(50).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  manufacturer: z.string().max(100).optional().nullable(),
  warrantyExpiry: z.string().date().optional().nullable(),
  assignedTo: z.number().int().positive().optional().nullable(),
  assignedBranch: z.string().max(100).optional().nullable(),
  businessReference: z.string().max(50).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  conditionRating: z.number().int().min(1).max(10).optional().default(5),
  notes: z.string().optional().nullable(),
  depreciationRate: z.number().min(0).max(100).optional().default(0),
  depreciationMethod: depreciationMethodSchema.optional().default('straight_line'),
  vendorReference: z.string().max(50).optional().nullable(),
  vendorName: z.string().max(255).optional().nullable(),
});

export const updateAssetSchema = createAssetSchema.partial().extend({
  disposalDate: z.string().date().optional().nullable(),
  disposalMethod: disposalMethodSchema.optional().nullable(),
  disposalProceeds: z.number().min(0).optional(),
  disposalCost: z.number().min(0).optional(),
  disposalNotes: z.string().optional().nullable(),
  accumulatedDepreciation: z.number().min(0).optional(),
  bookValue: z.number().min(0).optional(),
});

export const assetFiltersSchema = z.object({
  search: z.string().optional(),
  status: assetStatusSchema.optional(),
  businessReference: z.string().max(50).nullable().optional(),
  vendorReference: z.string().max(50).nullable().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  page: z.number().int().min(1).default(1),
});

export const disposeAssetSchema = z.object({
  disposalDate: z.string().date(),
  disposalMethod: disposalMethodSchema,
  disposalProceeds: z.number().min(0).default(0),
  disposalCost: z.number().min(0).optional(),
  disposalVendorRef: z.string().max(50).optional().nullable(),
  disposalNotes: z.string().optional().nullable(),
});

export const maintenanceSchema = z.object({
  assetReference: z.string().min(1),
  maintenanceType: z.enum(['repair', 'inspection', 'upgrade', 'cleaning', 'calibration']).default('repair'),
  description: z.string().min(1).max(1000),
  cost: z.number().min(0).optional().default(0),
  currency: z.string().length(3).optional().default('USD'),
  expenseReference: z.string().max(50).optional().nullable(),
  performedOn: z.string().date(),
  performedBy: z.string().max(100).optional().nullable(),
  nextDue: z.string().date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AssetFilters = z.infer<typeof assetFiltersSchema>;
export type DisposeAssetInput = z.infer<typeof disposeAssetSchema>;
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;