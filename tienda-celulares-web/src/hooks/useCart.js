import { useCallback, useMemo, useState } from 'react';

// Carrito de la venta en curso. Cada línea: { producto, cantidad, imeis, descuentoPct }.
// Los celulares se venden por IMEI: su cantidad es la cantidad de IMEI elegidos.
const isPhone = (producto) => producto.tipo_producto === 'Celular';

export function useCart() {
  const [lines, setLines] = useState([]);

  const add = useCallback((producto) => {
    setLines((prev) =>
      prev.some((l) => l.producto.id_producto === producto.id_producto)
        ? prev
        : [...prev, { producto, cantidad: isPhone(producto) ? 0 : 1, imeis: [], descuentoPct: 0 }],
    );
  }, []);

  const patch = useCallback((id, changes) => {
    setLines((prev) => prev.map((l) => (l.producto.id_producto === id ? { ...l, ...changes } : l)));
  }, []);

  const setQuantity = useCallback((id, cantidad) => patch(id, { cantidad }), [patch]);
  const setImeis = useCallback((id, imeis) => patch(id, { imeis, cantidad: imeis.length }), [patch]);
  const setDiscount = useCallback((id, descuentoPct) => patch(id, { descuentoPct }), [patch]);
  const remove = useCallback((id) => setLines((prev) => prev.filter((l) => l.producto.id_producto !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.cantidad * Number(l.producto.precio_venta) * (1 - l.descuentoPct / 100), 0),
    [lines],
  );

  // Cuerpo de items para POST /ventas. El descuento solo se envía si el usuario lo puso:
  // sin él, la API aplica sola la promoción vigente del producto.
  const toItems = useCallback(
    () =>
      lines.map((l) => ({
        id_producto: l.producto.id_producto,
        cantidad: l.cantidad,
        ...(isPhone(l.producto) ? { imeis: l.imeis } : {}),
        ...(l.descuentoPct > 0
          ? { descuento: Math.round(l.cantidad * Number(l.producto.precio_venta) * l.descuentoPct) / 100 }
          : {}),
      })),
    [lines],
  );

  const ready = lines.length > 0 && lines.every((l) => l.cantidad > 0);

  return { lines, add, remove, setQuantity, setImeis, setDiscount, clear, subtotal, toItems, ready };
}
