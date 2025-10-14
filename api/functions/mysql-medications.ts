import { withCORS } from "../utils/cors";
import { sendJSON, handleError, HttpError } from "../utils/errors";
import { getPool } from "../utils/mysql";
import mysql from "mysql2/promise";
import { requireUser } from "../utils/auth";

function traceId() {
  return `b44-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* --------------------------------- Types ---------------------------------- */
type MedicationRow = {
  id: number;
  user_id: string | null;
  name: string;
  dose: string | null;
  route: string | null;
  frequency: string | null;
  started_on: string | null; // YYYY-MM-DD
  stopped_on: string | null; // YYYY-MM-DD
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CreateMedication = Partial<MedicationRow> & { name: string };

/* ------------------------------ Data helpers ------------------------------ */
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

async function fetchMedicationOwner(id: number): Promise<string | null> {
  const p = await getPool();
  const [rows] = await p.execute<mysql.RowDataPacket[]>(
    "SELECT user_id FROM medications WHERE id = ?",
    [id]
  );
  const r = (rows as any[])[0];
  return r ? (r.user_id as string | null) : null;
}

async function listMedications(params: {
  user_id?: string;
  q?: string;      // text search on name
  limit?: number;
  offset?: number;
}) {
  const p = await getPool();
  const limit = clamp(params.limit ?? 25, 1, 200);
  const offset = Math.max(params.offset ?? 0, 0);

  const where: string[] = [];
  const args: any[] = [];

  if (params.user_id) {
    where.push("user_id = ?");
    args.push(params.user_id);
  }
  if (params.q) {
    where.push("name LIKE ?");
    args.push(`%${params.q}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await p.execute<mysql.RowDataPacket[]>(
    `SELECT id, user_id, name, dose, route, frequency, started_on, stopped_on, notes, created_at, updated_at
       FROM medications
       ${whereSql}
       ORDER BY COALESCE(stopped_on, '9999-12-31') DESC, started_on DESC, id DESC
       LIMIT ? OFFSET ?`,
    [...args, limit, offset]
  );
  return rows as unknown as MedicationRow[];
}

async function createMedication(input: CreateMedication) {
  const p = await getPool();
  const name = (input.name ?? "").toString().trim();
  if (!name) throw new HttpError(400, "Missing required field: 'name'");

  const user_id = input.user_id ? String(input.user_id) : null;
  const dose = input.dose == null ? null : String(input.dose);
  const route = input.route == null ? null : String(input.route);
  const frequency = input.frequency == null ? null : String(input.frequency);
  const started_on = input.started_on == null ? null : String(input.started_on);
  const stopped_on = input.stopped_on == null ? null : String(input.stopped_on);
  const notes = input.notes == null ? null : String(input.notes);

  const [result] = await p.execute<mysql.ResultSetHeader>(
    `INSERT INTO medications (user_id, name, dose, route, frequency, started_on, stopped_on, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, name, dose, route, frequency, started_on, stopped_on, notes]
  );

  return {
    id: result.insertId,
    user_id, name, dose, route, frequency, started_on, stopped_on, notes,
  } satisfies Partial<MedicationRow>;
}

async function updateMedication(id: number, input: Partial<MedicationRow>) {
  const p = await getPool();
  if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");

  const allowed: (keyof MedicationRow)[] = [
    "name", "dose", "route", "frequency", "started_on", "stopped_on", "notes",
  ];
  const sets: string[] = [];
  const args: any[] = [];

  for (const key of allowed) {
    if (key in input && input[key as keyof MedicationRow] !== undefined) {
      sets.push(`${key} = ?`);
      // @ts-ignore
      args.push(input[key]);
    }
  }
  if (!sets.length) throw new HttpError(400, "No updatable fields provided");

  args.push(id);
  const [result] = await p.execute<mysql.ResultSetHeader>(
    `UPDATE medications SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args
  );
  return { affectedRows: result.affectedRows };
}

async function deleteMedication(id: number) {
  const p = await getPool();
  if (!Number.isFinite(id)) throw new HttpError(400, "Invalid id");
  const [result] = await p.execute<mysql.ResultSetHeader>(
    `DELETE FROM medications WHERE id = ?`,
    [id]
  );
  return { affectedRows: result.affectedRows };
}

/* ------------------------------- HTTP handler ------------------------------ */
export default withCORS(async (req, res) => {
  const tid = traceId();
  try {
    if (!["GET", "POST", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(req.method ?? "")) {
      res.setHeader("Allow", "GET, POST, PATCH, DELETE, HEAD, OPTIONS");
      throw new HttpError(405, "Method Not Allowed");
    }

    if (req.method === "OPTIONS") {
      res.setHeader("X-Trace-Id", tid);
      res.status(204).end();
      return;
    }

    if (req.method === "HEAD") {
      // lightweight aliveness
      const p = await getPool();
      const c = await p.getConnection(); try { await c.ping(); } finally { c.release(); }
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      res.status(200).end();
      return;
    }

    // Parse URL for query + id param
    const url = new URL(req.url ?? "", "http://localhost");
    const idParam = url.pathname.match(/\/api\/mysql-medications\/(\d+)$/)?.[1];

    if (req.method === "GET") {
      const user_id = url.searchParams.get("user_id") ?? undefined;
      const q = url.searchParams.get("q") ?? undefined;
      const limit = url.searchParams.get("limit");
      const offset = url.searchParams.get("offset");
      const rows = await listMedications({
        user_id,
        q,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, { ok: true, rows, count: rows.length, traceId: tid });
      return;
    }

    if (req.method === "POST") {
      const { user_id } = await requireUser(req);              // enforce ownership
      const body = { ...(req.body ?? {}), user_id } as CreateMedication;
      const created = await createMedication(body);
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, { ok: true, created, traceId: tid });
      return;
    }

    if (req.method === "PATCH") {
      if (!idParam) throw new HttpError(400, "PATCH requires /api/mysql-medications/:id");
      const id = Number(idParam);
      const { user_id } = await requireUser(req);
      const owner = await fetchMedicationOwner(id);
      if (!owner || owner !== user_id) throw new HttpError(403, "Forbidden");
      const body = req.body ?? {};
      const result = await updateMedication(id, body);
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, { ok: true, updated: result, traceId: tid });
      return;
    }

    if (req.method === "DELETE") {
      if (!idParam) throw new HttpError(400, "DELETE requires /api/mysql-medications/:id");
      const id = Number(idParam);
      const { user_id } = await requireUser(req);
      const owner = await fetchMedicationOwner(id);
      if (!owner || owner !== user_id) throw new HttpError(403, "Forbidden");
      const result = await deleteMedication(id);
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, { ok: true, deleted: result, traceId: tid });
      return;
    }
  } catch (err) {
    res.setHeader("X-Trace-Id", tid);
    handleError(res, err);
  }
});
