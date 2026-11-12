import { CATALOG_LIMIT } from '../config/catalog';
import { get } from './transport';
import { mapProduct } from './mappers';

export const productsApi = {
  // filters: { q, tipo, categoria (nombre), marca (nombre), orden, limite }
  async list({ limite = CATALOG_LIMIT, ...filters } = {}) {
    const data = await get('/publico/catalogo', { ...filters, limit: limite });
    return data.map(mapProduct);
  },

  async getById(id) {
    return mapProduct(await get(`/publico/catalogo/${id}`));
  },
};
