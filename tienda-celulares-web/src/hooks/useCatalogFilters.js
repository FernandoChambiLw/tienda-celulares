import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_SORT } from '../config/catalog';

// Los filtros viven en la URL (?tipo=Celular&marca=3). Así el botón "atrás" funciona
// y cualquier búsqueda se puede compartir como enlace.
export function useCatalogFilters() {
  const [params, setParams] = useSearchParams();

  const filters = {
    q: params.get('q') ?? '',
    tipo: params.get('tipo') ?? '',
    categoria: params.get('categoria') ?? '',
    marca: params.get('marca') ?? '',
    orden: params.get('orden') ?? DEFAULT_SORT,
  };

  const setFilter = useCallback(
    (name, value) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (value) next.set(name, value);
          else next.delete(name);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const clearFilters = useCallback(() => setParams({}, { replace: true }), [setParams]);

  return { filters, setFilter, clearFilters };
}
