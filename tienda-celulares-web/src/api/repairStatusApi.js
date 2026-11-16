import { get } from './transport';

// Consulta pública: exige el N° de orden y el CI del cliente (la API valida que coincidan).
export const repairStatusApi = {
  find: ({ codigo, ci }) => get('/publico/reparacion', { codigo, ci }),
};
