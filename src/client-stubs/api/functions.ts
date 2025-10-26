// src/client-stubs/api/functions.ts
import { z } from 'zod';
import { api, apiZ } from '@/lib/api';
import { ClimbZ, MedicationZ } from '@shared/type';

type Json = Record<string, unknown>;

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

const ClimbListZ = listEnvelope(ClimbZ);
const MedicationListZ = listEnvelope(MedicationZ);

// ---- OpenAI chat
export async function openaiChat(payload: unknown): Promise<unknown> {
  return api.post('/api/openai-chat', { json: payload as Json });
}
export const OpenAIChat = openaiChat;

// ---- Egress IP (GET)
export async function egressIp(): Promise<unknown> {
  return api.get('/api/egress-ip');
}

// ---- DB placeholder (GET)
export async function db(): Promise<unknown> {
  return api.get('/api/db');
}

// ---- MySQL: Climbs (RAW reads validated; writes unchanged)
export const mysqlClimbs = {
  list: (query?: Record<string, unknown>) =>
    apiZ.get('/api/mysql-climbs', { params: query } as any, ClimbListZ),
  create: (body: Record<string, unknown>) => api.post('/api/mysql-climbs', { json: body }),
  update: (body: Record<string, unknown>) => api.put('/api/mysql-climbs', { json: body }),
  remove: (id: number) => api.delete('/api/mysql-climbs?id=' + encodeURIComponent(String(id))),
};

// ---- MySQL: Medications (RAW reads validated)
export const mysqlMedications = {
  list: (query?: Record<string, unknown>) =>
    apiZ.get('/api/mysql-medications', { params: query } as any, MedicationListZ),
};

export default {
  openaiChat,
  OpenAIChat,
  egressIp,
  db,
  mysqlClimbs,
  mysqlMedications,
};
