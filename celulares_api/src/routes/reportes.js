import { Router } from 'express';
import { q } from '../db.js';
import { ah } from '../utils.js';
import { requireRole } from '../auth.js';

const router = Router();

// GET /api/reportes/resumen  (panel de inicio)
router.get('/resumen', requireRole(), ah(async (_req, res) => {
  const [hoy, mes, bajo, reps, top, por_dia, gar, por_mes, pedidos, cobrar, cajas] = await Promise.all([
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
    q(`SELECT to_char(date_trunc('month', fecha_hora), 'YYYY-MM') AS mes, SUM(total) AS total, COUNT(*)::int AS ventas
         FROM v_venta_total
        WHERE estado = 'Completada' AND fecha_hora >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY 1 ORDER BY 1`),
    q(`SELECT COUNT(*)::int AS n FROM pedido WHERE estado = 'Nuevo'`),
    q(`SELECT COALESCE(SUM(saldo),0) AS total, COUNT(*)::int AS n FROM v_cuenta_saldo WHERE estado = 'Pendiente'`),
    q(`SELECT COUNT(*)::int AS n FROM caja WHERE estado = 'Abierta'`),
  ]);
  res.json({
    ventas_hoy: hoy.rows[0], ventas_mes: mes.rows[0], productos_bajo_stock: bajo.rows[0].n,
    reparaciones_por_estado: reps.rows, top_productos_30d: top.rows, ventas_ultimos_7_dias: por_dia.rows,
    garantias_por_vencer_30d: gar.rows[0].n, ventas_ultimos_6_meses: por_mes.rows, pedidos_nuevos: pedidos.rows[0].n,
    por_cobrar: cobrar.rows[0], cajas_abiertas: cajas.rows[0].n,
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

// GET /api/reportes/ventas?desde=&hasta=   (solo Administrador; la utilidad usa el costo ACTUAL del producto)
router.get('/ventas', requireRole(), ah(async (req, res) => {
  const f = [req.query.desde || null, req.query.hasta || null];
  const FILTRO = `v.estado = 'Completada'
        AND v.fecha_hora >= COALESCE($1::date, '1900-01-01') AND v.fecha_hora < COALESCE($2::date + 1, '2999-01-01')`;
  const [tot, vend, prod, marca, metodo, dia, anuladas] = await Promise.all([
    q(`SELECT COUNT(*)::int AS ventas, COALESCE(SUM(total),0) AS total FROM v_venta_total v WHERE ${FILTRO}`, f),
    q(`SELECT e.id_empleado, e.nombres || ' ' || e.apellido_paterno AS vendedor, COUNT(*)::int AS ventas, SUM(v.total) AS total
         FROM v_venta_total v JOIN empleado e USING (id_empleado) WHERE ${FILTRO} GROUP BY e.id_empleado ORDER BY total DESC`, f),
    q(`SELECT p.id_producto, p.nombre AS producto, SUM(d.cantidad)::int AS unidades, SUM(d.subtotal) AS ingresos,
              SUM(d.cantidad * p.precio_compra) AS costo, SUM(d.subtotal - d.cantidad * p.precio_compra) AS utilidad
         FROM detalle_venta d JOIN venta v USING (id_venta) JOIN producto p USING (id_producto)
        WHERE ${FILTRO} GROUP BY p.id_producto ORDER BY ingresos DESC LIMIT 50`, f),
    q(`SELECT m.nombre AS marca, SUM(d.cantidad)::int AS unidades, SUM(d.subtotal) AS ingresos,
              SUM(d.subtotal - d.cantidad * p.precio_compra) AS utilidad
         FROM detalle_venta d JOIN venta v USING (id_venta) JOIN producto p USING (id_producto) JOIN marca m USING (id_marca)
        WHERE ${FILTRO} GROUP BY m.nombre ORDER BY ingresos DESC`, f),
    q(`SELECT mp.nombre AS metodo, COUNT(*)::int AS ventas, SUM(v.total) AS total
         FROM v_venta_total v JOIN metodo_pago mp USING (id_metodo_pago) WHERE ${FILTRO} GROUP BY mp.nombre ORDER BY total DESC`, f),
    q(`SELECT v.fecha_hora::date AS dia, SUM(v.total) AS total FROM v_venta_total v WHERE ${FILTRO} GROUP BY 1 ORDER BY 1`, f),
    q(`SELECT COUNT(*)::int AS n FROM venta v WHERE v.estado = 'Anulada'
          AND v.fecha_hora >= COALESCE($1::date, '1900-01-01') AND v.fecha_hora < COALESCE($2::date + 1, '2999-01-01')`, f),
  ]);
  const costo = prod.rows.length ? (await q(
    `SELECT COALESCE(SUM(d.cantidad * p.precio_compra),0) AS costo
       FROM detalle_venta d JOIN venta v USING (id_venta) JOIN producto p USING (id_producto) WHERE ${FILTRO}`, f)).rows[0].costo : 0;
  // descuento general de la venta resta a la utilidad: total de ventas - costo
  res.json({
    ...tot.rows[0], costo, utilidad: Math.round((tot.rows[0].total - costo) * 100) / 100, anuladas: anuladas.rows[0].n,
    por_vendedor: vend.rows, por_producto: prod.rows, por_marca: marca.rows, por_metodo: metodo.rows, por_dia: dia.rows,
  });
}));

// GET /api/reportes/reposicion  -> productos bajo el mínimo con su último proveedor y cantidad sugerida
router.get('/reposicion', requireRole('Almacenero'), ah(async (_req, res) => {
  const { rows } = await q(
    `SELECT p.id_producto, p.codigo, p.nombre AS producto, s.stock_total, s.stock_minimo_total,
            GREATEST(s.stock_minimo_total * 2 - s.stock_total, 1)::int AS sugerido,
            ult.id_proveedor, ult.proveedor, ult.precio_unitario AS ultimo_costo
       FROM v_stock_producto s JOIN producto p USING (id_producto)
       LEFT JOIN LATERAL (
            SELECT pr.id_proveedor, pr.razon_social AS proveedor, d.precio_unitario
              FROM detalle_compra d JOIN compra_proveedor cp USING (id_compra) JOIN proveedor pr USING (id_proveedor)
             WHERE d.id_producto = p.id_producto AND cp.estado <> 'Anulada'
             ORDER BY cp.fecha_compra DESC, cp.id_compra DESC LIMIT 1) ult ON TRUE
      WHERE s.requiere_reposicion AND p.estado = 'Activo'
      ORDER BY ult.proveedor NULLS LAST, p.nombre`);
  res.json(rows);
}));

export default router;
