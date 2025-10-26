import { z } from 'zod';

/**
 * Mirrors your shared/type.ts Climb interface.
 */
export const ClimbSchema = z.object({
  id: z.number(),
  user_id: z.string().nullable(),
  name: z.string(),
  location: z.string().nullable(),
  date: z.string().nullable(),
  elevation_gain_m: z.number().nullable(),
  duration_hr: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const NewClimbSchema = ClimbSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateClimbSchema = NewClimbSchema.partial();

export type Climb = z.infer<typeof ClimbSchema>;
export type NewClimb = z.infer<typeof NewClimbSchema>;
export type UpdateClimb = z.infer<typeof UpdateClimbSchema>;
