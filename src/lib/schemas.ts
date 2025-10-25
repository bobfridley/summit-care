// schemas.ts (example)
import { z } from "zod";

export const MedicationSchema = z.object({
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

export const NewMedicationSchema = MedicationSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateMedicationSchema = NewMedicationSchema.partial();
