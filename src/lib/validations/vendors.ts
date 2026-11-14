import { z } from 'zod';

export const vendorStatusSchema = z.enum(['active', 'inactive', 'suspended', 'blacklisted']);
export const vendorKindSchema = z.enum(['supplier', 'manufacturer', 'distributor', 'service_provider']);
export const riskLevelSchema = z.enum(['low', 'medium', 'high']);

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().max(50).optional().nullable(),
  kind: vendorKindSchema.optional().default('supplier'),
  status: vendorStatusSchema.optional().default('active'),
  contactName: z.string().max(255).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  taxId: z.string().max(100).optional().nullable(),
  paymentTerms: z.string().max(200).optional().nullable(),
  notes: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
});

export const updateVendorSchema = createVendorSchema.partial();

export const vendorFiltersSchema = z.object({
  search: z.string().optional(),
  status: vendorStatusSchema.optional(),
  kind: vendorKindSchema.optional(),
  limit: z.number().int().min(1).max(100).default(10),
  page: z.number().int().min(1).default(1),
});

export const vendorScorecardSchema = z.object({
  onTimeDeliveryRate: z.number().min(0).max(100).optional(),
  defectRate: z.number().min(0).max(100).optional(),
  responsivenessScore: z.number().min(0).max(100).optional(),
  overallScore: z.number().min(0).max(100).optional(),
  financialRisk: riskLevelSchema.optional(),
  operationalRisk: riskLevelSchema.optional(),
  complianceRisk: riskLevelSchema.optional(),
  lastAssessed: z.string().datetime().optional(),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type VendorFilters = z.infer<typeof vendorFiltersSchema>;
export type VendorScorecardInput = z.infer<typeof vendorScorecardSchema>;