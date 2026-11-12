// Guarda el token JWT y los datos del usuario entre recargas de la página.
// localStorage puede fallar (modo privado, datos bloqueados): se envuelve y se
// usa memoria como respaldo, así la sesión funciona aunque no se pueda persistir.
const KEY = 'tm_session';
let memory = null;

export const session = {
  read() {
    if (memory) return memory;
    try {
      const raw = window.localStorage.getItem(KEY);
      memory = raw ? JSON.parse(raw) : null;
    } catch {
      memory = null;
    }
    return memory;
  },
  save(data) {
    memory = data;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // sin almacenamiento: la sesión dura hasta cerrar la pestaña
    }
  },
  clear() {
    memory = null;
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // nada que limpiar
    }
  },
  token() {
    return this.read()?.token ?? null;
  },
};
