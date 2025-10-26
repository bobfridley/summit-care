// src/client-stubs/api/index.ts

export const api = {
  async health<T = unknown>(): Promise<T> {
    const r = await fetch('/api/backend-health');
    if (!r.ok) throw new Error(`health ${r.status}`);
    return (await r.json()) as T;
  },
};

export async function invokeLLM<T = unknown>(prompt: string, model = 'gpt-4o-mini'): Promise<T> {
  const r = await fetch('/api/openai-chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt, model }),
  });
  if (!r.ok) throw new Error(`invokeLLM ${r.status}`);
  return (await r.json()) as T;
}
