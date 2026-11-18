import { Router } from 'express';
import { q } from '../db.js';
import { ah, notFound } from '../utils.js';

const router = Router();

// GET /api/garantias/imei/:imei  -> a quién se vendió, cuándo, garantía y reparaciones previas (cualquier usuario del panel)
router.get('/imei/:imei', ah(async (req, res) => {
  const imei = String(req.params.imei).replace(/\D/g, '');
  const u = (await q(
    `SELECT u.id_unidad, u.imei, pc.modelo, p.nombre AS producto, u.estado AS estado_unidad,
            v.id_venta, v.fecha_hora AS fecha_venta, v.estado AS estado_venta,
            c.id_cliente, c.nombres || ' ' || c.apellido_paterno AS cliente, c.ci AS cliente_ci,
            (SELECT numero FROM telefono_cliente t WHERE t.id_cliente = c.id_cliente ORDER BY (t.tipo = 'WhatsApp') DESC, id_telefono LIMIT 1) AS cliente_telefono
       FROM unidad_celular u
       JOIN celular pc ON pc.id_producto = u.id_producto
       JOIN producto p ON p.id_producto = u.id_producto
       LEFT JOIN detalle_venta_unidad du ON du.id_unidad = u.id_unidad
       LEFT JOIN venta v ON v.id_venta = du.id_venta AND v.estado <> 'Anulada'
       LEFT JOIN cliente c ON c.id_cliente = v.id_cliente
      WHERE u.imei = $1`, [imei])).rows[0];
  if (!u) throw notFound('No existe un equipo con ese IMEI en el sistema');
  u.garantias = (await q(
    `SELECT g.id_garantia, g.fecha_inicio, g.fecha_fin, g.meses, gv.dias_restantes, gv.estado_real AS estado
       FROM garantia g JOIN v_garantia_vigencia gv USING (id_garantia) WHERE g.id_unidad = $1 ORDER BY g.fecha_fin DESC`, [u.id_unidad])).rows;
  u.reparaciones = (await q(
    `SELECT id_reparacion, fecha_ingreso, estado, falla_reportada FROM reparacion WHERE id_unidad = $1 ORDER BY fecha_ingreso DESC`, [u.id_unidad])).rows;
  res.json(u);
}));

export default router;
