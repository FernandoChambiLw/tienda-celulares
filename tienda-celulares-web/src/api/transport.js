import { env } from '../config/env';
import { request } from './httpClient';
import { mockGet } from './mock/mockBackend';

// Los módulos *Api.js llaman a get(); no saben si responde el servidor real o el mock.
// Se elige con VITE_USE_MOCK en el archivo .env.
export const get = env.useMock
  ? (path, params) => mockGet(path, params)
  : (path, params) => request(path, { params });
