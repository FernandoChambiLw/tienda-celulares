import { useSyncExternalStore } from 'react';

// Carrito de compras del visitante. Vive en un almacén simple fuera de React (igual que el comparador)
// para que el botón de cada tarjeta, el menú y la página del carrito se mantengan sincronizados.
// Se guarda en localStorage; si el navegador lo bloquea, sigue funcionando en memoria.
// Cada línea guarda lo necesario para mostrarse sin volver a pedir datos; el PRECIO real
// lo vuelve a calcular el servidor al enviar el pedido.
const KEY = 'fx-carrito';
export const MAX_PER_ITEM = 10;
export const MAX_LINES = 20;

let lines = [];
try {
  const saved = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
  if (Array.isArray(saved)) {
    lines = saved
      .filter((l) => Number.isInteger(l?.id) && Number.isInteger(l?.cantidad) && l.cantidad > 0)
      .slice(0, MAX_LINES);
  }
} catch {
  /* sin almacenamiento: se empieza vacío */
}

const listeners = new Set();
function commit(next) {
  lines = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* ignorar */
  }
  listeners.forEach((fn) => fn());
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getSnapshot = () => lines;

export function useShopCart() {
  const list = useSyncExternalStore(subscribe, getSnapshot);
  return {
    lines: list,
    count: list.reduce((sum, l) => sum + l.cantidad, 0),
    total: list.reduce((sum, l) => sum + l.cantidad * l.precio, 0),
    has: (id) => list.some((l) => l.id === id),
    add: (product, cantidad = 1) => {
      const found = list.find((l) => l.id === product.id);
      if (found) {
        commit(list.map((l) => (l.id === product.id ? { ...l, cantidad: Math.min(l.cantidad + cantidad, MAX_PER_ITEM) } : l)));
      } else if (list.length < MAX_LINES) {
        commit([...list, { id: product.id, nombre: product.nombre, marca: product.marca, tipo: product.tipo, color: product.color, precio: product.precioFinal, fotoUrl: product.fotoUrl, cantidad }]);
      }
    },
    setQuantity: (id, cantidad) =>
      commit(list.map((l) => (l.id === id ? { ...l, cantidad: Math.max(1, Math.min(cantidad, MAX_PER_ITEM)) } : l))),
    remove: (id) => commit(list.filter((l) => l.id !== id)),
    clear: () => commit([]),
  };
}
