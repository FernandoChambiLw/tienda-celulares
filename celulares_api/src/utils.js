export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const bad = (m) => new HttpError(400, m);
export const notFound = (m = 'No encontrado') => new HttpError(404, m);

/** Envuelve un handler async para que sus errores lleguen al middleware de errores. */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function pick(obj = {}, fields) {
  const o = {};
  for (const f of fields) if (obj[f] !== undefined) o[f] = obj[f];
  return o;
}

export function required(obj, fields) {
  const miss = fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === '');
  if (miss.length) throw bad(`Faltan campos: ${miss.join(', ')}`);
}

export function toInt(v, name) {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw bad(`${name} debe ser un entero positivo`);
  return n;
}

export function toNum(v, name, { min = 0 } = {}) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min) throw bad(`${name} inválido`);
  return n;
}

// Los nombres de tabla/columna provienen SIEMPRE de listas fijas (pick), nunca del usuario.
export function insertSql(table, data) {
  const cols = Object.keys(data);
  if (!cols.length) throw bad('No hay datos para guardar');
  return {
    text: `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
    values: cols.map((c) => data[c]),
  };
}

export function updateSql(table, idCol, id, data) {
  const cols = Object.keys(data);
  if (!cols.length) throw bad('No hay datos para actualizar');
  return {
    text: `UPDATE ${table} SET ${cols.map((c, i) => `${c} = $${i + 1}`).join(', ')} WHERE ${idCol} = $${cols.length + 1} RETURNING *`,
    values: [...cols.map((c) => data[c]), id],
  };
}

export function pageParams(req) {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  return { limit, offset };
}
