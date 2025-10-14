import { withCORS } from "../utils/cors";
import { sendJSON, handleError, HttpError } from "../utils/errors";
import { getPool } from "../utils/mysql";
import mysql from "mysql2/promise";
import { requireUser, tryRequireUser } from "../utils/auth";

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
  q?: string;
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
      const p = await getPool();
      const c = await p.getConnection(); try { await c.ping(); } finally { c.release(); }
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      res.status(200).end();
      return;
    }

    const url = new URL(req.url ?? "", "http://localhost");
    const idParam = url.pathname.match(/\/api\/mysql-medications\/(\d+)$/)?.[1];

    if (req.method === "GET") {
      const authed = await tryRequireUser(req);
      // If authed, always scope to the caller's own rows.
      const effectiveUserId = authed?.user_id ?? (url.searchParams.get("user_id") ?? undefined);

      const q = url.searchParams.get("q") ?? undefined;
      const limit = url.searchParams.get("limit");
      const offset = url.searchParams.get("offset");
      const rows = await listMedications({
        user_id: effectiveUserId,
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
      const { user_id } = await requireUser(req);
      const body = { ...(req.body ?? {}), user_id } as CreateMedication;
      const p = await getPool();
      const name = (body.name ?? "").toString().trim();
      if (!name) throw new HttpError(400, "Missing required field: 'name'");

      const [result] = await p.execute<mysql.ResultSetHeader>(
        `INSERT INTO medications (user_id, name, dose, route, frequency, started_on, stopped_on, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          name,
          body.dose ?? null,
          body.route ?? null,
          body.frequency ?? null,
          body.started_on ?? null,
          body.stopped_on ?? null,
          body.notes ?? null,
        ]
      );

      const created = {
        id: result.insertId,
        user_id,
        name,
        dose: body.dose ?? null,
        route: body.route ?? null,
        frequency: body.frequency ?? null,
        started_on: body.started_on ?? null,
        stopped_on: body.stopped_on ?? null,
        notes: body.notes ?? null,
      };

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

      const p = await getPool();
      const body = req.body ?? {};
      const allowed: (keyof MedicationRow)[] = [
        "name", "dose", "route", "frequency", "started_on", "stopped_on", "notes",
      ];
      const sets: string[] = [];
      const args: any[] = [];

      for (const key of allowed) {
        if (key in body && body[key as keyof MedicationRow] !== undefined) {
          sets.push(`${key} = ?`);
          // @ts-ignore
          args.push(body[key]);
        }
      }
      if (!sets.length) throw new HttpError(400, "No updatable fields provided");
      args.push(id);

      const [result] = await p.execute<mysql.ResultSetHeader>(
        `UPDATE medications SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        args
      );

      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, { ok: true, updated: { affectedRows: result.affectedRows }, traceId: tid });
      return;
    }

    if (req.method === "DELETE") {
      if (!idParam) throw new HttpError(400, "DELETE requires /api/mysql-medications/:id");
      const id = Number(idParam);
      const { user_id } = await requireUser(req);
      const owner = await fetchMedicationOwner(id);
      if (!owner || owner !== user_id) throw new HttpError(403, "Forbidden");

      const p = await getPool();
      const [result] = await p.execute<mysql.ResultSetHeader>(
        `DELETE FROM medications WHERE id = ?`,
        [id]
      );

      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, { ok: true, deleted: { affectedRows: result.affectedRows }, traceId: tid });
      return;
    }
  } catch (err) {
    res.setHeader("X-Trace-Id", tid);
    handleError(res, err);
  }
});
