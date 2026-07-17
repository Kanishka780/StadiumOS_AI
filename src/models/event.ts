import { z } from 'zod';

export const OperationalEventSchema = z.object({
  id: z.string().min(1),
  zoneId: z.string().min(1),
  type: z.enum([
    'congestion',
    'security_anomaly',
    'accessibility_sos',
    'sustainability_alert',
    'weather_hazard',
    'evacuation',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
  recommendedActions: z.record(z.string(), z.string()), // mapping of Role -> recommended text instruction
  createdAt: z.string().datetime(),
  expectedImpact: z.string().optional(),
  affectedEntities: z.array(z.string()).optional(),
  alternativeActions: z.array(z.string()).optional(),
});

export type OperationalEvent = z.infer<typeof OperationalEventSchema>;

export const EventTimelineEntrySchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  timestamp: z.string().min(1),
  stage: z.enum(['twin', 'fan', 'volunteer', 'security', 'accessibility', 'executive']),
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['completed', 'active', 'pending']),
});

export type EventTimelineEntry = z.infer<typeof EventTimelineEntrySchema>;

export const IngestSignalPayloadSchema = z.union([
  z.object({
    count: z.number().nonnegative(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
  }),
  z.object({
    camera_id: z.string(),
    classification: z.string(),
    description: z.string(),
  }),
  z.object({
    user_id: z.string(),
    device_type: z.string(),
    location_description: z.string(),
  }),
  z.object({
    bin_id: z.string(),
    fill_level: z.number().min(0).max(100),
    type: z.string(),
  }),
  z.object({
    temperature: z.number(),
    wind_speed: z.number().nonnegative(),
    description: z.string(),
  }),
  z.object({
    trigger_source: z.string(),
    reason: z.string(),
  }),
  z.record(z.string(), z.any()),
]);

export type IngestSignalPayload = z.infer<typeof IngestSignalPayloadSchema>;
