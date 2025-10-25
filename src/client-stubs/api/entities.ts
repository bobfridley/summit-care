// src/client-stubs/api/entities.ts
import { z } from 'zod';
import { apiZ } from '@/lib/api';
import { MedicationZ, ClimbZ } from '@shared/type';

// helper: list/envelope union
const listEnvelope = <S extends z.ZodTypeAny>(item: S) =>
  z.union([
    z.array(item),
    z.object({
      ok: z.boolean().optional(),
      count: z.number().nonnegative().optional(),
      rows: z.array(item),
      page: z.unknown().optional(),
    }),
  ]);

// schemas for reads
const MedicationListZ = listEnvelope(MedicationZ);
const MedicationReadZ = z.union([MedicationZ, MedicationListZ]);

const ClimbListZ = listEnvelope(ClimbZ);
const ClimbReadZ = z.union([ClimbZ, ClimbListZ]);

export const MedicationDatabase = {
  // RAW list (validated)
  list(query?: Record<string, unknown>) {
    return apiZ.get('/api/mysql-medications', { params: query } as any, MedicationListZ);
  },
  // RAW single read (some backends return a single object, others a one-row envelope)
  getById(id: number) {
    return apiZ.get('/api/mysql-medications', { params: { id } } as any, MedicationReadZ);
  },
};

// Optional placeholders (kept as never so accidental use throws clearly)
function notImplemented(name: string): never {
  throw new Error(`[entities] ${name} is not implemented in client stubs`);
}
export const Medication = new Proxy({}, { get: () => () => notImplemented('Medication') }) as never;
export const Climb = new Proxy({}, { get: () => () => notImplemented('Climb') }) as never;

export default {
  MedicationDatabase,
  Medication,
  Climb,
};
