import { z } from 'zod';

export const ZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  currentDensity: z.number().nonnegative(), // percentage 0-100
  flowRate: z.number().nonnegative(), // fans per minute entering/leaving
  overlayColor: z.string().min(1), // semantic indicator class (e.g. 'crowd-safe')
  lastUpdated: z.string().datetime(),
});

export type Zone = z.infer<typeof ZoneSchema>;
