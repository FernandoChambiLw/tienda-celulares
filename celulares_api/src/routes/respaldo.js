import { Router } from 'express';
import { tx } from '../db.js';
import { ah } from '../utils.js';
import { requireRole } from '../auth.js';
import { audit } from '../bitacora.js';
import { exportarTodo } from '../backup.js';

const router = Router();

// GET /api/respaldo  -> descarga un archivo JSON con TODA la base (solo Administrador)
router.get('/', requireRole(), ah(async (req, res) => {
  // transacción de solo lectura con instantánea: el respaldo es consistente aunque se esté vendiendo
  const data = await tx(async (c) => {
    await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    return exportarTodo(c);
  });
  const filas = Object.values(data.tablas).reduce((n, t) => n + t.length, 0);
  await audit(req, 'Respaldo', 'sistema', null, `${Object.keys(data.tablas).length} tablas, ${filas} registros`);
  const nombre = `respaldo-fx-${data.fecha.slice(0, 10)}.json`;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
  res.send(JSON.stringify(data));
}));

export default router;
