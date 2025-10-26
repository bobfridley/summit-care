export const runtime = 'nodejs'; // MySQL requires Node, not Edge

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { NewMedicationSchema, MedicationSchema } from '@/lib/schemas/medication';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM medications ORDER BY id DESC');
    // Validate reads with Zod (returns raw data on success)
    const ok = MedicationSchema.array().parse(rows);
    return NextResponse.json(ok);
  } catch (err: any) {
    return NextResponse.json(
      { message: 'Failed to fetch medications', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = NewMedicationSchema.parse(json);

    const [result] = await pool.query(
      `INSERT INTO medications
       (user_id, name, dose, route, frequency, started_on, stopped_on, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.name,
        data.dose,
        data.route,
        data.frequency,
        data.started_on,
        data.stopped_on,
        data.notes,
      ]
    );

    // Return the created row
    // @ts-ignore - mysql2 returns OkPacket with insertId
    const id = result.insertId as number;
    const [rows] = await pool.query('SELECT * FROM medications WHERE id = ?', [id]);

    const created = MedicationSchema.parse((rows as any[])[0]);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    const status = err?.name === 'ZodError' ? 400 : 500;
    return NextResponse.json(
      {
        message: 'Failed to create medication',
        detail: err?.issues ?? err?.message ?? String(err),
      },
      { status }
    );
  }
}
