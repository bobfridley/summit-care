import { apiZ } from "@/lib/apiZ";
import {
  MedicationSchema,
  NewMedicationSchema,
  UpdateMedicationSchema,
} from "@/lib/schemas/medication";
import {
  ClimbSchema,
  NewClimbSchema,
  UpdateClimbSchema,
} from "@/lib/schemas/climb";

// CRUD client for medications
export const medicationsApi = apiZ({
  baseUrl: "/api",
  resource: "medications",
  readSchema: MedicationSchema,
  createSchema: NewMedicationSchema,
  updateSchema: UpdateMedicationSchema,
});

// CRUD client for climbs
export const climbsApi = apiZ({
  baseUrl: "/api",
  resource: "climbs",
  readSchema: ClimbSchema,
  createSchema: NewClimbSchema,
  updateSchema: UpdateClimbSchema,
});
