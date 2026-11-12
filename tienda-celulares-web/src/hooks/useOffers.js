import { productsApi } from '../api/productsApi';
import { useAsync } from './useAsync';

// La API no tiene una ruta de "solo ofertas": los productos con promoción vigente
// ya vienen marcados con su descuento, así que se filtran aquí.
export function useOffers() {
  return useAsync(async () => {
    const products = await productsApi.list();
    return products.filter((product) => product.descuento > 0);
  }, []);
}
