import { z } from 'zod';

export const IncidentSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  departmentsAffected: z.array(z.string()),
  status: z.enum(['reported', 'investigating', 'resolved']),
  timestamp: z.string().datetime(),
  zoneId: z.string().min(1),
  reportedBy: z.string().optional(),
});

export type Incident = z.infer<typeof IncidentSchema>;
