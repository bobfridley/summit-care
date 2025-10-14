// api/functions/dbHelpers.js
import { query, withConn } from '../../lib/db.js';

/** Simple ping */
export async function pingDb() {
  await query('SELECT 1');
  return true;
}

/** Run a list of parameterized statements in a single transaction */
export async function runInTransaction(statements = []) {
  return withConn(async (conn) => {
    await conn.beginTransaction();
    try {
      for (const { sql, params = [] } of statements) {
        await conn.execute(sql, params);
      }
      await conn.commit();
      return { ok: true };
    } catch (e) {
      await conn.rollback();
      throw e;
    }
  });
}

export { query, withConn };
