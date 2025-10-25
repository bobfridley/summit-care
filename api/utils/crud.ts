// api/utils/crud.ts
import { z, ZodTypeAny } from 'zod';
import { withCORS } from './cors';
import { sendJSON, handleError, HttpError } from './errors';
import * as db from '../lib/db';
import { requireUser } from './auth';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

type UserCtx = { email?: string | null; roles?: string[] };

type RBAC = {
  requireAuth?: boolean; // default true
  isAdmin?: (roles?: readonly string[] | null) => boolean; // default roles?.includes('admin')
  allowCreate?: (user: UserCtx) => boolean;
  allowUpdate?: (user: UserCtx) => boolean;
  allowDelete?: (user: UserCtx) => boolean;
  filterListByOwnerIfNotAdmin?: boolean; // default false
};

type CrudOptions<Row extends RowDataPacket> = {
  table: string;
  ownershipField?: keyof Row & string; // e.g., 'created_by_email'
  searchableColumns?: (keyof Row & string)[]; // for q=
  orderBy?: string; // e.g., 'created_at DESC'
  defaultLimit?: number; // default 100

  // Zod schemas
  rowSchema: ZodTypeAny;
  createSchema?: ZodTypeAny; // required for POST
  updateSchema?: ZodTypeAny; // required for PUT

  rbac?: RBAC;
};

const defaultIsAdmin = (roles?: readonly string[] | null) =>
  Array.isArray(roles) && roles.includes('admin');

export function makeCrudHandler<Row extends RowDataPacket>(opts: CrudOptions<Row>) {
  const {
    table,
    ownershipField,
    searchableColumns = [],
    orderBy = 'id DESC',
    defaultLimit = 100,
     
    rowSchema: _rowSchema, // intentionally unused (kept for future strict validation)
    createSchema,
    updateSchema,
    rbac,
  } = opts;

  const {
    requireAuth = true,
    isAdmin = defaultIsAdmin,
    allowCreate = (u: UserCtx) => isAdmin(u.roles ?? []), // default admin-only
    allowUpdate = (u: UserCtx) => isAdmin(u.roles ?? []),
    allowDelete = (u: UserCtx) => isAdmin(u.roles ?? []),
    filterListByOwnerIfNotAdmin = false,
  } = rbac ?? {};

  const ListQuerySchema = z.object({
    q: z.string().trim().min(1).max(200).optional(),
    email: z.string().email().optional(),
    limit: z.coerce.number().int().positive().max(500).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  });

  return withCORS(async (req: Request) => {
    try {
      const user: UserCtx = requireAuth ? await requireUser(req) : { email: null, roles: [] };
      const admin = isAdmin(user?.roles ?? []);

      if (req.method === 'GET') {
        const url = new URL(req.url);
        const parsed = ListQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
        if (!parsed.success) throw new HttpError(400, 'Invalid query', parsed.error.flatten());

        const { q, email, limit = defaultLimit, offset = 0 } = parsed.data;

        const clauses: string[] = [];
        const args: unknown[] = [];

        if (filterListByOwnerIfNotAdmin && ownershipField && !admin) {
          clauses.push(`${ownershipField} = ?`);
          args.push(user.email ?? null);
        } else if (email && ownershipField) {
          clauses.push(`${ownershipField} = ?`);
          args.push(email);
        }

        if (q && searchableColumns.length > 0) {
          const likes = searchableColumns.map((c) => `${c} LIKE ?`).join(' OR ');
          clauses.push(`(${likes})`);
          const like = `%${q}%`;
          for (let i = 0; i < searchableColumns.length; i++) args.push(like);
        }

        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
        const sql = `
          SELECT *
          FROM ${table}
          ${where}
          ORDER BY ${orderBy}
          LIMIT ?
          OFFSET ?
        `;
        args.push(limit, offset);

        const rows = await db.rows<Row>(sql, args);

        return sendJSON(200, {
          ok: true,
          count: rows.length,
          rows,
          page: { limit, offset, q: q ?? null, email: email ?? null },
        });
      }

      if (req.method === 'POST') {
        if (!createSchema) {
          return sendJSON(
            405,
            { error: 'Method Not Allowed' },
            { Allow: 'GET,PUT,DELETE,OPTIONS' }
          );
        }
        if (!allowCreate(user)) throw new HttpError(403, 'Forbidden');

        const body = await req.json().catch(() => ({}));
        const parsed = createSchema.safeParse(body);
        if (!parsed.success) throw new HttpError(400, 'Invalid body', parsed.error.flatten());

        const data = parsed.data as Record<string, unknown>;

        if (ownershipField) {
          (data)[ownershipField] = user.email ?? null; // prevent spoofing
        }

        const cols = Object.keys(data);
        const placeholders = cols.map(() => '?').join(',');
        const values = cols.map((k) => (data)[k] ?? null) as unknown[];

        const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`;
        const res: ResultSetHeader = await db.exec(sql, values);

        return sendJSON(200, { ok: true, created_id: Number(res.insertId ?? 0) });
      }

      if (req.method === 'PUT') {
        if (!updateSchema) {
          return sendJSON(
            405,
            { error: 'Method Not Allowed' },
            { Allow: 'GET,POST,DELETE,OPTIONS' }
          );
        }
        if (!allowUpdate(user)) throw new HttpError(403, 'Forbidden');

        const body = await req.json().catch(() => ({}));
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) throw new HttpError(400, 'Invalid body', parsed.error.flatten());

        const { id, ...patch } = parsed.data as { id: number } & Record<string, unknown>;
        if (!id) throw new HttpError(400, 'Missing id');

        if (ownershipField && !admin) {
          const ownerRows = await db.rows<RowDataPacket>(
            `SELECT ${ownershipField} FROM ${table} WHERE id = ? LIMIT 1`,
            [id]
          );
          const owner = ownerRows[0]?.[ownershipField] as string | undefined;
          if (!owner || owner !== (user.email ?? '')) throw new HttpError(403, 'Not allowed');
        }

        const sets: string[] = [];
        const args: unknown[] = [];
        Object.entries(patch).forEach(([k, v]) => {
          sets.push(`${k} = ?`);
          args.push(v ?? null);
        });
        if (sets.length === 0) return sendJSON(200, { ok: true, updated: { affectedRows: 0 } });

        args.push(id);
        const sql = `UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`;
        const res: ResultSetHeader = await db.exec(sql, args);

        return sendJSON(200, {
          ok: true,
          updated: { affectedRows: Number(res.affectedRows ?? 0) },
        });
      }

      if (req.method === 'DELETE') {
        if (!allowDelete(user)) throw new HttpError(403, 'Forbidden');

        const url = new URL(req.url);
        const id = Number(url.searchParams.get('id') ?? '0');
        if (!id) throw new HttpError(400, 'Missing id');

        if (ownershipField && !admin) {
          const ownerRows = await db.rows<RowDataPacket>(
            `SELECT ${ownershipField} FROM ${table} WHERE id = ? LIMIT 1`,
            [id]
          );
          const owner = ownerRows[0]?.[ownershipField] as string | undefined;
          if (!owner || owner !== (user.email ?? '')) throw new HttpError(403, 'Not allowed');
        }

        const res: ResultSetHeader = await db.exec(`DELETE FROM ${table} WHERE id = ?`, [id]);
        return sendJSON(200, {
          ok: true,
          deleted: { affectedRows: Number(res.affectedRows ?? 0) },
        });
      }

      return sendJSON(
        405,
        { error: 'Method Not Allowed' },
        { Allow: 'GET,POST,PUT,DELETE,OPTIONS' }
      );
    } catch (err) {
      return handleError(err);
    }
  });
}
