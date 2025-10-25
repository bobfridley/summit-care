import { z } from "zod";

/**
 * Mirrors your shared/type.ts Medication interface.
 */
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

// Derived write schemas
export const NewMedicationSchema = MedicationSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateMedicationSchema = NewMedicationSchema.partial();

// Type inference helpers
export type Medication = z.infer<typeof MedicationSchema>;
export type NewMedication = z.infer<typeof NewMedicationSchema>;
export type UpdateMedication = z.infer<typeof UpdateMedicationSchema>;
