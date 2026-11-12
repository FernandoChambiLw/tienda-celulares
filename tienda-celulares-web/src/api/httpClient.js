import { env } from '../config/env';
import { session } from './session';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Quien quiera enterarse de que la sesión venció (AuthContext) se registra aquí.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// Cliente HTTP mínimo. Aquí (y solo aquí) se usa fetch.
// Si hay sesión iniciada, agrega el token JWT a cada petición.
export async function request(path, { method = 'GET', params, body, signal } = {}) {
  const url = new URL(env.apiUrl + path, window.location.origin);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const token = session.token();
  const headers = {};
  const isForm = body instanceof FormData; // para fotos: el navegador pone el Content-Type solo
  if (body && !isForm) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body && !isForm ? JSON.stringify(body) : body,
    signal,
  });

  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const data = await response.json();
      message = data.error ?? data.message ?? message; // la API responde { error: "..." }
    } catch {
      // la respuesta de error no traía JSON; se deja el mensaje por defecto
    }
    // Token vencido o usuario bloqueado: se cierra la sesión (el login no lleva token, no entra aquí).
    if (response.status === 401 && token) onUnauthorized();
    throw new ApiError(message, response.status);
  }

  return response.status === 204 ? null : response.json();
}
