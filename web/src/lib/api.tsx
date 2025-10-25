const BASE_URL = import.meta.env.VITE_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`API ${path} failed: ${r.status} ${r.statusText} ${text}`);
  }
  return r.json() as Promise<T>;
}

export const api = {
  health: () => jsonFetch<{ status: string; service: string; time: string }>('/api/health'),
  egressIp: () => jsonFetch<{ egress_ip: string }>('/api/egress-ip'),
  openaiChat: (body: { messages: any[]; model?: string }) =>
    jsonFetch('/api/openai-chat', { method: 'POST', body: JSON.stringify(body) }),
  contraindications: (drug: string) =>
    jsonFetch(`/api/contraindications`, {
      method: 'POST',
      body: JSON.stringify({ drug }),
    }),
  aeTrends: (opts: { drug: string; count?: string; since?: string; until?: string }) =>
    jsonFetch(`/api/ae-trends`, { method: 'POST', body: JSON.stringify(opts) }),
  db: () => jsonFetch('/api/db'),
};
