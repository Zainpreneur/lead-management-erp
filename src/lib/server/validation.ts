import { z } from 'zod';

export const leadInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  category: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  source: z.string().default('other'),
  stage: z.string().default('new'),
  priority: z.string().default('warm'),
  estimatedValue: z.number().min(0).default(0),
  score: z.number().min(0).max(100).optional().default(0),
  contactName: z.string().nullable().optional(),
  contactRole: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional().or(z.literal('')).transform((v) => (v === '' ? null : v)),
  contactPhone: z.string().nullable().optional(),
  social: z.record(z.string(), z.string()).optional().default({}),
  notes: z.string().nullable().optional(),
  assignedTo: z.number().nullable().optional(),
  assignedTeam: z.string().nullable().optional(),
  followUpDate: z.string().nullable().optional(),
  reminderDays: z.number().int().min(1).max(30).optional().default(3),
});

export const leadActivitySchema = z.object({
  kind: z.enum(['note', 'call', 'email', 'meeting', 'quote', 'stage_change', 'converted']),
  summary: z.string().min(1),
  note: z.string().nullable().optional(),
  actor: z.string().optional(),
});

export const leadStageSchema = z.object({
  stage: z.enum(['new', 'contacted', 'qualified', 'quoted', 'won', 'lost']),
  actor: z.string().optional(),
  note: z.string().nullable().optional(),
});

export const leadConvertSchema = z.object({
  businessId: z.number().optional(),
  businessName: z.string().min(1),
  category: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  actor: z.string(),
});

export type LeadInputValidated = z.infer<typeof leadInputSchema>;