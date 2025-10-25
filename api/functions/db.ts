// api/functions/db.ts
export const runtime = 'edge';
export const preferredRegion = ['iad1', 'sfo1'];

import { withCORS } from '../utils/cors';
import { sendJSON } from '../utils/errors';
import { traceId as makeTraceId } from '../base44Client';

// Single handler, non-async (no require-await issues)
export default withCORS((req: Request) => {
  // Let withCORS handle OPTIONS automatically; you can still special-case if desired.
  if (req.method !== 'GET') {
    // Minimal method guard
    return sendJSON(405, { status: 'error', error: 'Method Not Allowed' }, { Allow: 'GET' });
  }

  const tid = makeTraceId();
  // TODO: add a DB ping or actual logic later
  return sendJSON(200, { status: 'ok', note: 'db endpoint placeholder', traceId: tid });
});
