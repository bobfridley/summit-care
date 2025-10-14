import { withCORS } from "../utils/cors";
import { sendJSON, handleError, HttpError } from "../utils/errors";
import { pingDb, tableCount } from "../utils/mysql";

function traceId() {
  return `b44-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * GET /api/db
 *   - ?op=ping                      -> { ok:true, ping:1 }
 *   - ?op=count&table=medications   -> { ok:true, table:"medications", count:123 }
 *   - ?op=count&table=climbs        -> { ok:true, table:"climbs", count:42 }
 *
 * HEAD /api/db  -> quick aliveness (performs ping)
 * OPTIONS       -> 204
 */
export default withCORS(async (req, res) => {
  const tid = traceId();

  try {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method ?? "")) {
      res.setHeader("Allow", "GET, HEAD, OPTIONS");
      throw new HttpError(405, "Method Not Allowed");
    }

    if (req.method === "OPTIONS") {
      res.setHeader("X-Trace-Id", tid);
      res.status(204).end();
      return;
    }

    if (req.method === "HEAD") {
      await pingDb();
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      res.status(200).end();
      return;
    }

    // GET
    const url = new URL(req.url ?? "", "http://localhost");
    const op = (url.searchParams.get("op") ?? "ping").toLowerCase();

    if (op === "ping") {
      const pong = await pingDb();
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, { ok: true, ping: pong, traceId: tid });
      return;
    }

    if (op === "count") {
      const table = (url.searchParams.get("table") ?? "").trim();
      if (!table) throw new HttpError(400, "Missing 'table' for count");
      // You can whitelist if you want: if (!["medications","climbs"].includes(table)) throw new HttpError(400, "Invalid table");
      const count = await tableCount(table);
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Trace-Id", tid);
      sendJSON(res, 200, { ok: true, table, count, traceId: tid });
      return;
    }

    throw new HttpError(400, "Unknown op. Use op=ping or op=count&table=<name>");
  } catch (err) {
    res.setHeader("X-Trace-Id", tid);
    handleError(res, err);
  }
});
