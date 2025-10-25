// src/client-stubs/api/integrations.ts
import { api, type QueryValue } from '@/lib/api';

/** -------------------------------
 *  OpenAI chat
 *  ------------------------------- */
export async function openaiChat<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  return api.post<T>('/api/openai-chat', { json: payload });
}
// optional alias for back-compat naming
export const OpenAIChat = openaiChat;

/** -------------------------------
 *  Egress IP + DB placeholder
 *  ------------------------------- */
export async function egressIp<T = unknown>(): Promise<T> {
  return api.get<T>('/api/egress-ip');
}

export async function db<T = unknown>(): Promise<T> {
  return api.get<T>('/api/db');
}

/** A convenient alias for the params shape api.get expects */
type QueryParams = Readonly<Record<string, QueryValue>>;

/** -------------------------------
 *  MySQL: Climbs (callable + methods)
 *  ------------------------------- */
export function mysqlClimbs<T = unknown>(query?: QueryParams): Promise<T> {
  return api.get<T>('/api/mysql-climbs', { params: query });
}

mysqlClimbs.list = <T = unknown>(query?: QueryParams): Promise<T> =>
  api.get<T>('/api/mysql-climbs', { params: query });

mysqlClimbs.create = <T = unknown>(body: Record<string, unknown>): Promise<T> =>
  api.post<T>('/api/mysql-climbs', { json: body });

mysqlClimbs.update = <T = unknown>(body: Record<string, unknown>): Promise<T> =>
  api.put<T>('/api/mysql-climbs', { json: body });

mysqlClimbs.remove = (id: number): Promise<unknown> =>
  api.delete('/api/mysql-climbs?id=' + encodeURIComponent(String(id)));

/** -------------------------------
 *  MySQL: Medications (callable + methods)
 *  ------------------------------- */
export function mysqlMedications<T = unknown>(query?: QueryParams): Promise<T> {
  return api.get<T>('/api/mysql-medications', { params: query });
}

mysqlMedications.list = <T = unknown>(query?: QueryParams): Promise<T> =>
  api.get<T>('/api/mysql-medications', { params: query });

/** -------------------------------
 *  Default export
 *  ------------------------------- */
export default {
  openaiChat,
  OpenAIChat,
  egressIp,
  db,
  mysqlClimbs,
  mysqlMedications,
};
