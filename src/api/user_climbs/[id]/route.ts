// src/api/user_climbs/[id]/route.ts
// wherever your ok() is defined (e.g., src/api/_utils/responses.ts)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { err, fromError } from '../../_utils/http';
import type { Climb } from '@shared/type';

// Replace this with your real data layer. If your real repo is async, make methods async and await DB calls.
const climbs = {
  getById(id: number): Climb | undefined {
    // TODO: replace with real implementation (or await your DB)
    return undefined;
  },
  update(id: number, partial: Partial<Climb>): Climb {
    // TODO: replace with real implementation (or await your DB)
    return { id, ...(partial as Omit<Climb, 'id'>) } as Climb;
  },
  remove(id: number): void {
    // TODO: replace with real implementation (or await your DB)
  },
};

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// keep a doc type if you want, but accept anything at the boundary
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data as unknown as Record<string, unknown>, init);
}

// GET /api/climbs/:id
export function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(ctx.params);
    const climb = climbs.getById(id);
    if (!climb) return err('Not found', 404);
    return ok(climb);
  } catch (e) {
    return fromError(e);
  }
}

// PUT /api/climbs/:id
export async function PUT(req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(ctx.params);
    const body = (await req.json()) as Partial<Climb>;
    const updated = climbs.update(id, body); // if your real call is async → await it
    return ok(updated);
  } catch (e) {
    return fromError(e);
  }
}

// DELETE /api/climbs/:id
export function DELETE(_req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ParamsSchema.parse(ctx.params);
    climbs.remove(id); // if async in real code, mark function async and await
    return new Response(null, { status: 204 });
  } catch (e) {
    return fromError(e);
  }
}
