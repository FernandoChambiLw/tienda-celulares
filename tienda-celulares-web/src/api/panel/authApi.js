import { request } from '../httpClient';

export const authApi = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  me: () => request('/auth/me'),
  changePassword: (actual, nueva) => request('/auth/cambiar-clave', { method: 'POST', body: { actual, nueva } }),
};
