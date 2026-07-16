import { z } from 'zod';

export const TransitModeShareSchema = z.object({
  transit: z.number().nonnegative(),
  driving: z.number().nonnegative(),
  walking: z.number().nonnegative(),
});

export const SustainabilityMetricsSchema = z.object({
  matchId: z.string().min(1),
  transitModeShare: TransitModeShareSchema,
  wasteDiversionRate: z.number().min(0).max(100), // percentage
  energyPerAttendee: z.number().nonnegative(), // kWh
  waterUsage: z.number().nonnegative(), // Litres
  updatedAt: z.string().datetime(),
});

export type TransitModeShare = z.infer<typeof TransitModeShareSchema>;
export type SustainabilityMetrics = z.infer<typeof SustainabilityMetricsSchema>;
