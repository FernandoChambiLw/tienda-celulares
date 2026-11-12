import 'dotenv/config';
import pg from 'pg';

// NUMERIC y BIGINT como número; DATE/TIMESTAMP como texto (evita desfases de zona horaria)
pg.types.setTypeParser(1700, (v) => parseFloat(v));
pg.types.setTypeParser(20, (v) => parseInt(v, 10));
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1114, (v) => v);

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  options: '-c search_path=celulares',
});

/** Ejecuta una consulta. `c` es opcional: un cliente de transacción. */
export const q = (text, params = [], c = pool) => c.query(text, params);

/** Ejecuta `fn(client)` dentro de una transacción (COMMIT/ROLLBACK automático). */
export async function tx(fn) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const out = await fn(c);
    await c.query('COMMIT');
    return out;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}
