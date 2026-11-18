import { get } from './transport';

// Consulta pública: exige el N° de orden y el CI del cliente (la API valida que coincidan).
export const repairStatusApi = {
  find: ({ codigo, ci }) => get('/publico/reparacion', { codigo, ci }),
};

// Consulta pública de garantía: solo con el IMEI; devuelve modelo y vigencia, nada del cliente.
export const warrantyApi = {
  find: (imei) => get('/publico/garantia', { imei }),
};
