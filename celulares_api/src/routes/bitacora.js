import { Router } from 'express';
import { q } from '../db.js';
import { ah, pageParams } from '../utils.js';
import { requireRole } from '../auth.js';

const router = Router();

// GET /api/bitacora?desde=&hasta=&accion=&usuario=   (solo Administrador)
router.get('/', requireRole(), ah(async (req, res) => {
  const { limit, offset } = pageParams(req);
  const params = []; const where = [];
  const add = (sql, v) => { params.push(v); where.push(sql.replace('{P}', `$${params.length}`)); };
  if (req.query.desde) add('fecha_hora >= {P}::date', req.query.desde);
  if (req.query.hasta) add('fecha_hora < ({P}::date + 1)', req.query.hasta);
  if (req.query.accion) add('accion ILIKE {P}', `%${req.query.accion}%`);
  if (req.query.usuario) add('usuario ILIKE {P}', `%${req.query.usuario}%`);
  params.push(limit, offset);
  const { rows } = await q(
    `SELECT * FROM bitacora ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY fecha_hora DESC, id_bitacora DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json(rows);
}));

export default router;
