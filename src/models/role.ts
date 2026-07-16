import { z } from 'zod';

export const RoleSchema = z.enum([
  'fan',
  'organizer',
  'volunteer',
  'security',
  'accessibility',
  'executive'
]);

export type UserRole = z.infer<typeof RoleSchema>;
