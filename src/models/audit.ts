import { z } from 'zod';

export const AuditLogSchema = z.object({
  id: z.string().min(1),
  actorUid: z.string().min(1),
  action: z.string().min(1),
  aiRecommendationId: z.string().min(1),
  decision: z.enum(['accept', 'override', 'snooze']),
  timestamp: z.string().datetime(),
  rationale: z.string().optional(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
