import { z } from 'zod';
export const taskInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  relatedType: z.string().nullable().optional(),
  relatedReference: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.number().nullable().optional(),
});
