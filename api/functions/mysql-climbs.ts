import { withCORS } from "../utils/cors";
import { sendJSON, handleError, HttpError } from "../utils/errors";
import { getPool } from "../utils/mysql";
import mysql from "mysql2/promise";
import { requireUser, tryRequireUser } from "../utils/auth";

function traceId() {
  return `b44-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* --------------------------------- Types ---------------------------------- */
type ClimbRow = {
  id: number;
  climber_id: string | null;
  peak: string | null;
  route: string | null;
  date: string | null; // YYYY-MM-DD
  duration_hours: number | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/* ------------------------------ Data helpers ------------------------------ */
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

async function fetchClimbOwner(id: number): Promise<string | null> {
  const p = await getPool();
  const [rows] = await p.execute<mysql.RowDataPacket[]>(
    "SELECT climber_id FROM climbs WHERE id = ?",
    [id]
  );
  const r = (rows as any[])[0];
  return r ? (r.climber_id as string | null) : null;
}

async function listClimbs(params: { climber_id?: string; limit?: number }) {
  const { climber_id, limit = 25 } = params;
  const p = await getPool();

  if (climber_id) {
    const [rows] = await p.execute<mysql.RowDataPacket[]>(
      `SELECT id, climber_id, peak, route, date, duration_hours, notes, created_at, updated_at
         FROM climbs
        WHERE climber_id = ?
        ORDER BY date DESC, id DESC
        LIMIT ?`,
      [climber_id, clamp(limit, 1, 200)]
    );
    return rows as unknown as ClimbRow[];
  } else {
    const [rows] = await p.execute<mysql.RowDataPacket[]>(
      `SELECT id, climber_id, peak, route, date, duration_hours, notes, created_at, updated_at
         FROM climbs
        ORDER BY date DESC, id DESC
        LIMIT ?`,
      [clamp(limit, 1, 200)]
    );
    return rows as unknown as ClimbRow[];
  }
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
    const idParam = url.pathname.match(/\/api\/mysql-climbs\/(\d+)$/)?.[1];

    if (req.method === "GET") {
      const authed = await tryRequireUser(req);
      const effectiveClimberId = authed?.user_id ?? (url.searchParams.get("climber_id") ?? undefined);
      const limitParam = url.searchParams.get("limit");
      const limit = limitParam ? parseInt(limitParam, 10) : undefined;

      const rows = await listClimbs({ climber_id: effectiveClimberId, limit });
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, { ok: true, rows, count: rows.length, traceId: tid });
      return;
    }

    if (req.method === "POST") {
      const { user_id } = await requireUser(req);
      const body = { ...(req.body ?? {}), climber_id: user_id } as Partial<ClimbRow>;

      // minimal validation
      const peak = (body.peak ?? "").toString().trim();
      const date = (body.date ?? "").toString().trim();
      if (!peak || !date) throw new HttpError(400, "Missing required fields: 'peak' and 'date'");

      const p = await getPool();
      const [result] = await p.execute<mysql.ResultSetHeader>(
        `INSERT INTO climbs (climber_id, peak, route, date, duration_hours, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          peak,
          body.route ? String(body.route) : null,
          date,
          body.duration_hours == null ? null : Number(body.duration_hours),
          body.notes == null ? null : String(body.notes),
        ]
      );

      const created = {
        id: result.insertId,
        climber_id: user_id,
        peak,
        route: body.route ? String(body.route) : null,
        date,
        duration_hours: body.duration_hours == null ? null : Number(body.duration_hours),
        notes: body.notes == null ? null : String(body.notes),
      };

      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, { ok: true, created, traceId: tid });
      return;
    }

    if (req.method === "PATCH") {
      if (!idParam) throw new HttpError(400, "PATCH requires /api/mysql-climbs/:id");
      const id = Number(idParam);
      const { user_id } = await requireUser(req);
      const owner = await fetchClimbOwner(id);
      if (!owner || owner !== user_id) throw new HttpError(403, "Forbidden");

      const body = req.body ?? {};
      const allowed: (keyof ClimbRow)[] = ["peak", "route", "date", "duration_hours", "notes"];
      const sets: string[] = [];
      const args: any[] = [];

      for (const key of allowed) {
        if (key in body && body[key as keyof ClimbRow] !== undefined) {
          sets.push(`${key} = ?`);
          // @ts-ignore
          args.push(body[key]);
        }
      }
      if (!sets.length) throw new HttpError(400, "No updatable fields provided");

      const p = await getPool();
      args.push(id);
      const [result] = await p.execute<mysql.ResultSetHeader>(
        `UPDATE climbs SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        args
      );

      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, { ok: true, updated: { affectedRows: result.affectedRows }, traceId: tid });
      return;
    }

    if (req.method === "DELETE") {
      if (!idParam) throw new HttpError(400, "DELETE requires /api/mysql-climbs/:id");
      const id = Number(idParam);
      const { user_id } = await requireUser(req);
      const owner = await fetchClimbOwner(id);
      if (!owner || owner !== user_id) throw new HttpError(403, "Forbidden");

      const p = await getPool();
      const [result] = await p.execute<mysql.ResultSetHeader>(
        `DELETE FROM climbs WHERE id = ?`,
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
