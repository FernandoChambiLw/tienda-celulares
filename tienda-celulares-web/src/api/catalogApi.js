import { get } from './transport';
import { mapFilters } from './mappers';

export const catalogApi = {
  // Marcas y categorías que realmente tienen productos activos.
  async getFilters() {
    return mapFilters(await get('/publico/filtros'));
  },
};
