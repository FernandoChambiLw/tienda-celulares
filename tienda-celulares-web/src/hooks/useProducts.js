import { productsApi } from '../api/productsApi';
import { useAsync } from './useAsync';

export function useProducts(filters) {
  return useAsync(() => productsApi.list(filters), [JSON.stringify(filters)]);
}

export function useProduct(id) {
  return useAsync(() => productsApi.getById(id), [id]);
}
