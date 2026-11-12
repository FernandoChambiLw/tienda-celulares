import { Router } from 'express';
import { q } from '../db.js';
import { ah } from '../utils.js';
import { requireRole } from '../auth.js';

const router = Router();

// GET /api/reportes/resumen  (panel de inicio)
router.get('/resumen', requireRole(), ah(async (_req, res) => {
  const [hoy, mes, bajo, reps, top, por_dia, gar] = await Promise.all([
    q(`SELECT COUNT(*)::int AS ventas, COALESCE(SUM(total),0) AS total FROM v_venta_total
        WHERE estado = 'Completada' AND fecha_hora::date = CURRENT_DATE`),
    q(`SELECT COUNT(*)::int AS ventas, COALESCE(SUM(total),0) AS total FROM v_venta_total
        WHERE estado = 'Completada' AND date_trunc('month', fecha_hora) = date_trunc('month', CURRENT_DATE)`),
    q(`SELECT COUNT(*)::int AS n FROM v_stock_producto s JOIN producto p USING (id_producto)
        WHERE s.requiere_reposicion AND p.estado = 'Activo'`),
    q(`SELECT estado, COUNT(*)::int AS cantidad FROM reparacion GROUP BY estado ORDER BY estado`),
    q(`SELECT p.id_producto, p.nombre, SUM(d.cantidad)::int AS unidades, SUM(d.subtotal) AS ingresos
         FROM detalle_venta d JOIN venta v USING (id_venta) JOIN producto p USING (id_producto)
        WHERE v.estado = 'Completada' AND v.fecha_hora >= CURRENT_DATE - 30
        GROUP BY p.id_producto ORDER BY unidades DESC, ingresos DESC LIMIT 5`),
    q(`SELECT fecha_hora::date AS dia, SUM(total) AS total FROM v_venta_total
        WHERE estado = 'Completada' AND fecha_hora >= CURRENT_DATE - 6 GROUP BY 1 ORDER BY 1`),
    q(`SELECT COUNT(*)::int AS n FROM v_garantia_vigencia WHERE estado_real = 'Vigente' AND dias_restantes <= 30`),
  ]);
  res.json({
    ventas_hoy: hoy.rows[0], ventas_mes: mes.rows[0], productos_bajo_stock: bajo.rows[0].n,
    reparaciones_por_estado: reps.rows, top_productos_30d: top.rows, ventas_ultimos_7_dias: por_dia.rows,
    garantias_por_vencer_30d: gar.rows[0].n,
  });
}));

// GET /api/reportes/ganancia?desde=&hasta=  (ingresos - costo de lo vendido, con el costo actual del producto)
router.get('/ganancia', requireRole(), ah(async (req, res) => {
  const { rows } = await q(
    `SELECT COALESCE(SUM(d.subtotal),0) AS ingresos, COALESCE(SUM(d.cantidad * p.precio_compra),0) AS costo,
            COALESCE(SUM(d.subtotal - d.cantidad * p.precio_compra),0) AS ganancia_bruta
       FROM detalle_venta d JOIN venta v USING (id_venta) JOIN producto p USING (id_producto)
      WHERE v.estado = 'Completada'
        AND v.fecha_hora >= COALESCE($1::date, '1900-01-01') AND v.fecha_hora < COALESCE($2::date + 1, '2999-01-01')`,
    [req.query.desde || null, req.query.hasta || null]);
  res.json(rows[0]);
}));

export default router;
