import { Router } from 'express';
import { q, tx } from '../db.js';
import { ah, notFound, toInt, bad, pageParams, HttpError } from '../utils.js';
import { requireRole } from '../auth.js';

const router = Router();
const atiende = requireRole('Vendedor');

// Un pedido solo avanza hacia adelante; Entregado y Cancelado son finales.
const SIGUIENTE = { Nuevo: ['Confirmado', 'Cancelado'], Confirmado: ['Entregado', 'Cancelado'], Entregado: [], Cancelado: [] };

// GET /api/pedidos?estado=
router.get('/', atiende, ah(async (req, res) => {
  const { limit, offset } = pageParams(req);
  const params = [];
  let where = '';
  if (req.query.estado) { params.push(req.query.estado); where = 'WHERE vp.estado = $1'; }
  params.push(limit, offset);
  const { rows } = await q(
    `SELECT vp.id_pedido, vp.fecha_hora, vp.nombre_cliente, vp.telefono, vp.estado, vp.total, vp.unidades
       FROM v_pedido_total vp ${where}
      ORDER BY (vp.estado = 'Nuevo') DESC, vp.fecha_hora DESC, vp.id_pedido DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json(rows);
}));

router.get('/:id', atiende, ah(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const p = (await q(
    `SELECT vp.*, u.username AS atendido_por FROM v_pedido_total vp
       LEFT JOIN usuario u ON u.id_usuario = vp.id_usuario_atendio WHERE vp.id_pedido = $1`, [id])).rows[0];
  if (!p) throw notFound('Pedido no encontrado');
  p.items = (await q(
    `SELECT d.id_producto, pr.codigo, pr.nombre AS producto, d.cantidad, d.precio_unitario,
            (d.cantidad * d.precio_unitario)::NUMERIC(12,2) AS subtotal
       FROM detalle_pedido d JOIN producto pr USING (id_producto)
      WHERE d.id_pedido = $1 ORDER BY pr.nombre`, [id])).rows;
  p.siguientes = SIGUIENTE[p.estado];
  res.json(p);
}));

// PATCH /api/pedidos/:id/estado  { estado }
router.patch('/:id/estado', atiende, ah(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const estado = String(req.body?.estado ?? '');
  if (!(estado in SIGUIENTE)) throw bad('Estado inválido');
  await tx(async (c) => {
    const actual = (await q('SELECT estado FROM pedido WHERE id_pedido = $1 FOR UPDATE', [id], c)).rows[0];
    if (!actual) throw notFound('Pedido no encontrado');
    if (!SIGUIENTE[actual.estado].includes(estado))
      throw new HttpError(409, `Un pedido ${actual.estado} no puede pasar a ${estado}`);
    await q('UPDATE pedido SET estado = $1, id_usuario_atendio = $2 WHERE id_pedido = $3', [estado, req.user.id_usuario, id], c);
  });
  res.json({ id_pedido: id, estado });
}));

export default router;
