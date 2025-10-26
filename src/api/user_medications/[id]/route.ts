export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ClimbSchema, UpdateClimbSchema } from '@/lib/schemas/climb';

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const [rows] = await pool.query('SELECT * FROM climbs WHERE id = ?', [params.id]);
    const row = (rows as any[])[0];
    if (!row) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    const ok = ClimbSchema.parse(row);
    return NextResponse.json(ok);
  } catch (err: any) {
    return NextResponse.json(
      { message: 'Failed to fetch climb', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const json = await req.json();
    const data = UpdateClimbSchema.parse(json);

    const fields: string[] = [];
    const values: any[] = [];
    for (const [k, v] of Object.entries(data)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
    if (!fields.length) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }
    values.push(params.id);

    await pool.query(`UPDATE climbs SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query('SELECT * FROM climbs WHERE id = ?', [params.id]);
    const updated = ClimbSchema.parse((rows as any[])[0]);
    return NextResponse.json(updated);
  } catch (err: any) {
    const status = err?.name === 'ZodError' ? 400 : 500;
    return NextResponse.json(
      { message: 'Failed to update climb', detail: err?.issues ?? err?.message ?? String(err) },
      { status }
    );
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await pool.query('DELETE FROM climbs WHERE id = ?', [params.id]);
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json(
      { message: 'Failed to delete climb', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
