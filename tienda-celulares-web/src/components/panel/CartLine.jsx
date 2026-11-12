import { inventoryApi } from '../../api/panel/panelApi';
import { useAsync } from '../../hooks/useAsync';
import { formatBs } from '../../utils/format';
import styles from './CartLine.module.css';

// Una línea del carrito. Los celulares piden elegir los IMEI; el resto, una cantidad.
export default function CartLine({ line, warehouseId, maxDiscount, onQuantity, onImeis, onDiscount, onRemove }) {
  const { producto } = line;
  const phone = producto.tipo_producto === 'Celular';
  const { data: units } = useAsync(
    () => (phone ? inventoryApi.units({ id_producto: producto.id_producto, id_almacen: warehouseId, estado: 'Disponible', limit: 200 }) : Promise.resolve([])),
    [producto.id_producto, warehouseId],
  );
  const free = (units ?? []).filter((u) => !line.imeis.includes(u.imei));
  const price = Number(producto.precio_venta);

  return (
    <li className={styles.line}>
      <div className={styles.top}>
        <strong>{producto.nombre}</strong>
        <button type="button" className={styles.remove} onClick={onRemove} aria-label={`Quitar ${producto.nombre}`}>Quitar</button>
      </div>

      {phone ? (
        <div className={styles.imeis}>
          {line.imeis.map((imei) => (
            <button key={imei} type="button" className={styles.chip} onClick={() => onImeis(line.imeis.filter((i) => i !== imei))}>
              {imei} ✕
            </button>
          ))}
          <select
            value=""
            onChange={(e) => e.target.value && onImeis([...line.imeis, e.target.value])}
            aria-label="Agregar IMEI"
          >
            <option value="">{free.length ? '+ Agregar IMEI' : 'Sin más unidades'}</option>
            {free.map((u) => <option key={u.id_unidad} value={u.imei}>{u.imei}</option>)}
          </select>
        </div>
      ) : (
        <label className={styles.field}>
          Cantidad
          <input
            type="number"
            min="1"
            max={producto.stock_total}
            value={line.cantidad}
            onChange={(e) => onQuantity(Math.max(1, Math.min(producto.stock_total, Number(e.target.value) || 1)))}
          />
        </label>
      )}

      <div className={styles.bottom}>
        <label className={styles.field}>
          Descuento %
          <input type="number" min="0" max={maxDiscount} step="1" value={line.descuentoPct}
            onChange={(e) => onDiscount(Math.max(0, Math.min(maxDiscount, Number(e.target.value) || 0)))} />
        </label>
        <span className={styles.price}>
          {formatBs(line.cantidad * price * (1 - line.descuentoPct / 100))}
          <small> {formatBs(price)} c/u</small>
        </span>
      </div>
    </li>
  );
}
