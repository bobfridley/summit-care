// api/entities.ts
// Server-side proxy to Base44 Entities (use inside /api only)
import { base44 } from './base44Client';

// If the Base44 SDK ships types, these will be strongly typed automatically.
export const Medication = base44.entities.Medication;
export const MedicationDatabase = base44.entities.MedicationDatabase;
export const Climb = base44.entities.Climb;

// Auth namespace (SDK’s user/session helpers)
export const User = base44.auth;

// Optional: export types (uncomment if you want explicit typing)
// export type MedicationEntity = typeof base44.entities.Medication;
// export type MedicationDatabaseEntity = typeof base44.entities.MedicationDatabase;
// export type ClimbEntity = typeof base44.entities.Climb;
