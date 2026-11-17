import { q } from './db.js';

/** Registra una acción en la bitácora. Nunca interrumpe la operación principal. */
export async function audit(req, accion, entidad, id_entidad, detalle, c) {
  try {
    await q(
      `INSERT INTO bitacora (id_usuario, usuario, accion, entidad, id_entidad, detalle) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user?.id_usuario ?? null, req.user?.username ?? null, accion, entidad, id_entidad ?? null,
       detalle ? String(detalle).slice(0, 400) : null], c);
  } catch (e) { console.error('[bitacora]', e.message); }
}
