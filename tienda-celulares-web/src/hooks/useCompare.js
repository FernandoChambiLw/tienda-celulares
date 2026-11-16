import { useSyncExternalStore } from 'react';

// Lista de productos a comparar (máximo 3). Vive en un almacén simple fuera de React
// para que el botón de cada tarjeta, la barra inferior y el menú se mantengan sincronizados.
// Se guarda en localStorage para sobrevivir a una recarga; si el navegador lo bloquea, sigue funcionando en memoria.
const KEY = 'fx-comparar';
export const MAX_COMPARE = 3;

let ids = [];
try {
  const saved = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
  if (Array.isArray(saved)) ids = saved.filter(Number.isInteger).slice(0, MAX_COMPARE);
} catch {
  /* sin almacenamiento: se empieza vacío */
}

const listeners = new Set();

function commit(next) {
  ids = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* ignorar */
  }
  listeners.forEach((fn) => fn());
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getSnapshot = () => ids;

export function useCompare() {
  const list = useSyncExternalStore(subscribe, getSnapshot);
  return {
    ids: list,
    has: (id) => list.includes(id),
    full: list.length >= MAX_COMPARE,
    toggle: (id) => {
      if (list.includes(id)) commit(list.filter((x) => x !== id));
      else if (list.length < MAX_COMPARE) commit([...list, id]);
    },
    remove: (id) => commit(list.filter((x) => x !== id)),
    clear: () => commit([]),
  };
}
