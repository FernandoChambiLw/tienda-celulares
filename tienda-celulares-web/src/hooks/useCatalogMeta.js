import { catalogApi } from '../api/catalogApi';
import { useAsync } from './useAsync';

// Marcas y categorías para llenar los filtros del catálogo.
export function useCatalogMeta() {
  return useAsync(() => catalogApi.getFilters(), []);
}
