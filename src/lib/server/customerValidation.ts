import { z } from 'zod';

export const customerInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  category: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactRole: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional().or(z.literal('')).transform((v) => (v === '' ? null : v)),
  contactPhone: z.string().nullable().optional(),
  social: z.record(z.string(), z.string()).optional().default({}),
  notes: z.string().nullable().optional(),
  assignedTo: z.number().nullable().optional(),
  assignedTeam: z.string().nullable().optional(),
  status: z.string().default('active'),
  mrr: z.number().min(0).optional().default(0),
  totalValue: z.number().min(0).optional().default(0),
  leadReference: z.string().nullable().optional(),
});