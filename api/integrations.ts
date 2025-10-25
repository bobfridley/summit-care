// api/integrations.ts
import { invokeLLM as httpInvokeLLM } from '@api/index'; // stub: (prompt: string, model?: string) => Promise<any>

/** Accepted shapes for LLM calls coming from other parts of the app */
type LlmPayload =
  | string
  | {
      prompt: string;
      model?: string;
    };

/**
 * Invoke LLM via the client stub.
 * - Accepts a raw string prompt, or an object { prompt, model? }.
 */
export function invokeLLM(payload: LlmPayload) {
  if (typeof payload === 'string') {
    return httpInvokeLLM(payload);
  }
  return httpInvokeLLM(payload.prompt, payload.model);
}

/** Back-compat alias (some callers might use PascalCase) */
export const InvokeLLM = invokeLLM;

/* ------------------------------------------------------------------ */
/* Tool-style calls routed through the /api/openai-chat endpoint      */
/* ------------------------------------------------------------------ */

type Jsonish = Record<string, unknown>;

async function postChat(tool: string, payload: Jsonish) {
  const res = await fetch('/api/openai-chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tool, ...payload }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`openai-chat ${res.status}: ${detail}`);
  }
  return res.json();
}

export function SendEmail(payload: Jsonish) {
  return postChat('SendEmail', payload);
}

export function GenerateImage(payload: Jsonish) {
  return postChat('GenerateImage', payload);
}

export function CreateFileSignedUrl(payload: Jsonish) {
  return postChat('CreateFileSignedUrl', payload);
}

export function UploadPrivateFile(payload: Jsonish) {
  return postChat('UploadPrivateFile', payload);
}
