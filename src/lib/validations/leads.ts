import { z } from 'zod';

export const leadSourceSchema = z.enum([
  'google_maps',
  'referral',
  'inbound',
  'cold_call',
  'cold_email',
  'linkedin',
  'trade_show',
  'website',
  'social',
  'other',
]);

export const leadStageSchema = z.enum([
  'new',
  'contacted',
  'qualified',
  'quoted',
  'won',
  'lost',
  'archived',
]);

export const leadPrioritySchema = z.enum(['hot', 'warm', 'cold']);

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.string().max(100).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  source: leadSourceSchema.default('other'),
  stage: leadStageSchema.default('new'),
  priority: leadPrioritySchema.default('warm'),
  estimatedValue: z.number().min(0).default(0),
  score: z.number().min(0).max(100).default(0),
  contactName: z.string().max(255).nullable().optional(),
  contactRole: z.string().max(100).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().max(50).nullable().optional(),
  social: z.record(z.string()).default({}),
  notes: z.string().nullable().optional(),
  assignedTo: z.number().int().positive().nullable().optional(),
  assignedTeam: z.string().max(100).nullable().optional(),
  followUpDate: z.string().date().nullable().optional(),
  reminderDays: z.number().int().min(0).max(365).default(3),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  stage: leadStageSchema.optional(),
  convertedAt: z.string().datetime().optional().nullable(),
  lostReason: z.string().max(500).optional().nullable(),
});

export const leadFiltersSchema = z.object({
  search: z.string().optional(),
  stage: leadStageSchema.optional(),
  source: leadSourceSchema.optional(),
  priority: leadPrioritySchema.optional(),
  assignedTo: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  page: z.number().int().min(1).default(1),
});

export type LeadFilters = z.infer<typeof leadFiltersSchema>;

export const convertLeadSchema = z.object({
  customerName: z.string().min(1).max(255).optional(),
  customerCategory: z.string().max(100).optional().nullable(),
  customerCity: z.string().max(100).optional().nullable(),
  customerCountry: z.string().max(100).optional().nullable(),
  contactName: z.string().max(255).optional().nullable(),
  contactRole: z.string().max(100).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
  assignedTo: z.number().int().positive().optional().nullable(),
  assignedTeam: z.string().max(100).optional().nullable(),
});

export const leadActivitySchema = z.object({
  kind: z.string().min(1).max(50),
  summary: z.string().min(1).max(1000),
  outcome: z.string().max(500).optional().nullable(),
  actor: z.string().min(1).max(100),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
export type LeadActivityInput = z.infer<typeof leadActivitySchema>;