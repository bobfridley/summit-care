// api/functions/invoke-llm.ts
export const runtime = 'edge';
export const preferredRegion = ['iad1', 'sfo1'];

import { traceId as makeTraceId } from '../base44Client';
import { withCORS } from '../utils/cors';
import { sendJSON, handleError, HttpError } from '../utils/errors';
import { invokeLLM } from '../integrations';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface InvokeBody {
  prompt: string;
  model?: string;
}

export default withCORS(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (req.method !== 'POST') {
      throw new HttpError(405, 'Method Not Allowed');
    }

    const tid = makeTraceId();
    const body = (await req.json().catch(() => ({}))) as Partial<InvokeBody>;

    // Validate prompt to avoid no-base-to-string downstream
    const prompt =
      typeof body.prompt === 'string'
        ? body.prompt
        : 'Hello! (No prompt provided — this is a default message.)';
    const model = typeof body.model === 'string' ? body.model : undefined;

    const llmInput = { prompt, model };
    const result = await invokeLLM(llmInput);

    return sendJSON(200, { ok: true, result, traceId: tid }, { 'X-Trace-Id': tid });
  } catch (err) {
    return handleError(err);
  }
});
