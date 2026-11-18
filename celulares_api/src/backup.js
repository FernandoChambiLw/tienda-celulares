import { q } from './db.js';

export const BACKUP_VERSION = 1;

const tablas = async (c) => (await q(
  `SELECT table_name FROM information_schema.tables WHERE table_schema = 'celulares' AND table_type = 'BASE TABLE' ORDER BY 1`, [], c)).rows.map((r) => r.table_name);

/** Exporta TODAS las tablas del esquema a un objeto JSON (las fotos BYTEA van en hexadecimal). */
export async function exportarTodo(c) {
  const data = {};
  for (const t of await tablas(c)) {
    const { rows } = await q(`SELECT * FROM "${t}"`, [], c);
    data[t] = rows.map((r) => {
      for (const k of Object.keys(r)) if (Buffer.isBuffer(r[k])) r[k] = `\\x${r[k].toString('hex')}`;
      return r;
    });
  }
  return { sistema: 'FX TECHNOLOGY', version: BACKUP_VERSION, fecha: new Date().toISOString(), tablas: data };
}

/**
 * Orden de carga según las llaves foráneas. Las llaves que aceptan NULL (p. ej. sucursal.id_encargado, que
 * rompe el ciclo sucursal <-> empleado) son "blandas": se cargan en NULL y se completan al final.
 */
async function planCarga(c, nombres) {
  const { rows } = await q(
    `SELECT cl.relname AS hija, cp.relname AS padre,
            (SELECT array_agg(a.attname::text ORDER BY a.attnum) FROM pg_attribute a WHERE a.attrelid = k.conrelid AND a.attnum = ANY(k.conkey)) AS cols,
            (SELECT bool_and(NOT a.attnotnull) FROM pg_attribute a WHERE a.attrelid = k.conrelid AND a.attnum = ANY(k.conkey)) AS blanda
       FROM pg_constraint k
       JOIN pg_class cl ON cl.oid = k.conrelid JOIN pg_class cp ON cp.oid = k.confrelid
       JOIN pg_namespace n ON n.oid = cl.relnamespace
      WHERE k.contype = 'f' AND n.nspname = 'celulares'`, [], c);
  // aristas hija -> padre; las llaves que aceptan NULL pueden "cortarse" si hay un ciclo
  const aristas = rows.filter((f) => f.hija !== f.padre && nombres.includes(f.hija) && nombres.includes(f.padre));
  const diferidas = new Map();
  for (const f of rows.filter((x) => x.hija === x.padre && x.blanda)) diferidas.set(f.hija, [...(diferidas.get(f.hija) ?? []), ...f.cols]);
  const orden = []; const hecho = new Set();
  while (orden.length < nombres.length) {
    const pendientes = nombres.filter((t) => !hecho.has(t));
    const listo = pendientes.filter((t) => aristas.every((f) => f.hija !== t || hecho.has(f.padre)));
    if (listo.length) { for (const t of listo) { hecho.add(t); orden.push(t); } continue; }
    // ciclo: cortar una llave blanda entre las tablas pendientes
    const corte = aristas.find((f) => !hecho.has(f.hija) && !hecho.has(f.padre) && f.blanda);
    if (!corte) throw new Error('Dependencias circulares entre tablas; no se puede restaurar');
    diferidas.set(corte.hija, [...(diferidas.get(corte.hija) ?? []), ...corte.cols]);
    aristas.splice(aristas.indexOf(corte), 1);
  }
  return { orden, diferidas };
}

/**
 * Restaura un respaldo. REEMPLAZA todos los datos actuales. Debe llamarse dentro de una transacción.
 * Los triggers de stock/IMEI se desactivan durante la carga: el respaldo ya trae el stock final.
 */
export async function restaurarTodo(c, backup) {
  if (!backup?.tablas || backup.version !== BACKUP_VERSION) throw new Error('Archivo de respaldo no válido');
  const existentes = await tablas(c);
  const { orden, diferidas } = await planCarga(c, existentes);
  const desconocidas = Object.keys(backup.tablas).filter((t) => !existentes.includes(t));
  if (desconocidas.length) throw new Error(`El respaldo trae tablas que no existen aquí: ${desconocidas.join(', ')}`);

  for (const t of ['movimiento_inventario', 'detalle_venta_unidad']) await q(`ALTER TABLE "${t}" DISABLE TRIGGER USER`, [], c);
  await q(`TRUNCATE ${existentes.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`, [], c);

  const resumen = {};
  for (const t of orden) {
    const filas = backup.tablas[t] ?? [];
    resumen[t] = filas.length;
    if (!filas.length) continue;
    const cols = (await q(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'celulares' AND table_name = $1 AND is_generated = 'NEVER' ORDER BY ordinal_position`,
      [t], c)).rows.map((r) => `"${r.column_name}"`);
    const dif = new Set((diferidas.get(t) ?? []).map((x) => `"${x}"`));
    const sel = cols.map((x) => (dif.has(x) ? `NULL AS ${x}` : x)).join(',');
    for (let i = 0; i < filas.length; i += 500) {
      await q(
        `INSERT INTO "${t}" (${cols.join(',')}) OVERRIDING SYSTEM VALUE
         SELECT ${sel} FROM jsonb_populate_recordset(NULL::"${t}", $1::jsonb)`,
        [JSON.stringify(filas.slice(i, i + 500))], c);
    }
  }
  // segunda pasada: completar las llaves blandas diferidas
  for (const [t, colsDif] of diferidas) {
    const filas = backup.tablas[t] ?? [];
    if (!filas.length) continue;
    const pk = (await q(
      `SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = ('celulares."' || $1 || '"')::regclass AND i.indisprimary`, [t], c)).rows.map((r) => `"${r.attname}"`);
    const sets = [...new Set(colsDif)].map((x) => `"${x}" = r."${x}"`).join(', ');
    await q(
      `UPDATE "${t}" x SET ${sets} FROM jsonb_populate_recordset(NULL::"${t}", $1::jsonb) r WHERE ${pk.map((k) => `x.${k} = r.${k}`).join(' AND ')}`,
      [JSON.stringify(filas)], c);
  }
  // Los contadores automáticos (IDs) continúan después del último registro restaurado.
  const ids = (await q(
    `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'celulares' AND is_identity = 'YES'`, [], c)).rows;
  for (const { table_name: t, column_name: col } of ids)
    await q(`SELECT setval(pg_get_serial_sequence('"${t}"', '${col}'), COALESCE((SELECT MAX("${col}") FROM "${t}"), 0) + 1, false)`, [], c);
  for (const t of ['movimiento_inventario', 'detalle_venta_unidad']) await q(`ALTER TABLE "${t}" ENABLE TRIGGER USER`, [], c);
  return resumen;
}
