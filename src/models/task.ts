import { z } from 'zod';

export const VolunteerTaskSchema = z.object({
  id: z.string().min(1),
  assignedTo: z.string().min(1),
  zoneId: z.string().min(1),
  instructions: z.string().min(1),
  status: z.enum(['pending', 'in_progress', 'completed', 'queued_offline']),
  timestamp: z.string().datetime(),
});

export type VolunteerTask = z.infer<typeof VolunteerTaskSchema>;
