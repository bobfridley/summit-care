// shared/type.ts
import { z } from 'zod';

export interface Medication {
  id: number;
  user_id: string | null;
  name: string;
  dose: string | null;
  route: string | null;
  frequency: string | null;
  started_on: string | null;
  stopped_on: string | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Climb {
  id: number;
  climber_id: string | null;
  peak: string | null;
  route: string | null;
  date: string | null;
  duration_hours: number | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const MedicationZ = z.object({
  id: z.number(),
  user_id: z.string().nullable(),
  name: z.string(),
  dose: z.string().nullable(),
  route: z.string().nullable(),
  frequency: z.string().nullable(),
  started_on: z.string().nullable(),
  stopped_on: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const ClimbZ = z.object({
  id: z.number(),
  climber_id: z.string().nullable(),
  peak: z.string().nullable(),
  route: z.string().nullable(),
  date: z.string().nullable(),
  duration_hours: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
