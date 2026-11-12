import { q } from '../db.js';
import { bad, toInt } from '../utils.js';

/** Almacén de la operación: el indicado o el primero activo de la sucursal del empleado. */
export async function resolverAlmacen(c, idAlmacen, idEmpleado) {
  if (idAlmacen) {
    const r = await q("SELECT id_almacen, id_sucursal FROM almacen WHERE id_almacen = $1 AND estado = 'Activo'",
      [toInt(idAlmacen, 'id_almacen')], c);
    if (!r.rows[0]) throw bad('Almacén inexistente o inactivo');
    return r.rows[0];
  }
  const r = await q(
    `SELECT a.id_almacen, a.id_sucursal FROM almacen a JOIN empleado e ON e.id_sucursal = a.id_sucursal
      WHERE e.id_empleado = $1 AND a.estado = 'Activo' ORDER BY a.id_almacen LIMIT 1`, [idEmpleado], c);
  if (!r.rows[0]) throw bad('Tu sucursal no tiene almacén activo; indica id_almacen');
  return r.rows[0];
}

/** Valida y normaliza la lista de ítems (sin repetir producto). */
export function validarItems(items, { conPrecio = false } = {}) {
  if (!Array.isArray(items) || !items.length) throw bad('Debe incluir al menos un producto en "items"');
  const vistos = new Set();
  return items.map((it) => {
    const id_producto = toInt(it.id_producto, 'id_producto');
    if (vistos.has(id_producto)) throw bad(`El producto ${id_producto} está repetido; sume las cantidades en una línea`);
    vistos.add(id_producto);
    const cantidad = toInt(it.cantidad, 'cantidad');
    if (conPrecio && (it.precio_unitario === undefined || !(Number(it.precio_unitario) >= 0)))
      throw bad('precio_unitario inválido');
    return { ...it, id_producto, cantidad };
  });
}
