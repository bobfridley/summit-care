// src/api/user_climbs/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

// --- Types -----------------------------------------------------------------
const ClimbCreate = z.object({
  name: z.string().min(1),
  date: z.string().datetime(),
  location: z.string().optional(),
  notes: z.string().optional(),
});
type ClimbCreate = z.infer<typeof ClimbCreate>;

type Climb = {
  id: number;
  name: string;
  date: string;
  location?: string;
  notes?: string;
};

interface Repo {
  list(): Promise<Climb[]>;
  create(input: ClimbCreate): Promise<Climb>;
}
const r: Repo = {
  async list() {
    throw new Error('wire repo');
  },
  async create(_input) {
    throw new Error('wire repo');
  },
};

// --- Helpers ---------------------------------------------------------------
function toErrorJSON(err: unknown) {
  if (err instanceof Error) return { name: err.name, message: err.message };
  return { message: 'Unknown error' };
}

// --- Routes ----------------------------------------------------------------
export async function GET() {
  try {
    const rows = await r.list();
    return NextResponse.json(rows, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ error: toErrorJSON(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const bodyUnknown: unknown = await req.json(); // 👈 unknown
    const parsed = ClimbCreate.safeParse(bodyUnknown); // 👈 validate
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const created = await r.create(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: toErrorJSON(err) }, { status: 500 });
  }
}
