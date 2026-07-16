import { z } from 'zod';

export const OperationalEventSchema = z.object({
  id: z.string().min(1),
  zoneId: z.string().min(1),
  type: z.enum(['congestion', 'security_anomaly', 'accessibility_sos', 'sustainability_alert', 'weather_hazard', 'evacuation']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
  recommendedActions: z.record(z.string(), z.string()), // mapping of Role -> recommended text instruction
  createdAt: z.string().datetime(),
});

export type OperationalEvent = z.infer<typeof OperationalEventSchema>;
