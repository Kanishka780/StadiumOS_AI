import { z } from 'zod';
import { RoleSchema } from './role';

export const UserSchema = z.object({
  uid: z.string().min(1),
  role: RoleSchema,
  language: z.enum(['en', 'es', 'fr']),
  accessibilityPrefs: z.object({
    needsHighContrast: z.boolean(),
    needsCognitiveMode: z.boolean(),
    needsVoiceGuidance: z.boolean(),
  }),
});

export type User = z.infer<typeof UserSchema>;
