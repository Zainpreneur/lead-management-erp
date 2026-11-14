import { z } from 'zod';

export const customerStatusSchema = z.enum(['active', 'paused', 'churned', 'archived']);

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  contactName: z.string().max(255).optional().nullable(),
  contactRole: z.string().max(100).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  social: z.record(z.string()).optional().default({}),
  notes: z.string().optional().nullable(),
  assignedTo: z.number().int().positive().optional().nullable(),
  assignedTeam: z.string().max(100).optional().nullable(),
  status: customerStatusSchema.optional().default('active'),
  mrr: z.number().min(0).optional().default(0),
  totalValue: z.number().min(0).optional().default(0),
  leadReference: z.string().max(50).optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerFiltersSchema = z.object({
  search: z.string().optional(),
  status: customerStatusSchema.optional(),
  assignedTo: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  page: z.number().int().min(1).default(1),
});

export const customerActivitySchema = z.object({
  kind: z.string().min(1).max(50),
  summary: z.string().min(1).max(1000),
  outcome: z.string().max(500).optional().nullable(),
  actor: z.string().min(1).max(100),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerFilters = z.infer<typeof customerFiltersSchema>;
export type CustomerActivityInput = z.infer<typeof customerActivitySchema>;