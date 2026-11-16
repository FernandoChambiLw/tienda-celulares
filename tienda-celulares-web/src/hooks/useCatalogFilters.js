import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_SORT } from '../config/catalog';

// Los filtros viven en la URL (?tipo=Celular&min=500&pagina=2). Así el botón "atrás" funciona
// y cualquier búsqueda se puede compartir como enlace.
export function useCatalogFilters() {
  const [params, setParams] = useSearchParams();

  const filters = {
    q: params.get('q') ?? '',
    tipo: params.get('tipo') ?? '',
    categoria: params.get('categoria') ?? '',
    marca: params.get('marca') ?? '',
    min: params.get('min') ?? '',
    max: params.get('max') ?? '',
    orden: params.get('orden') ?? DEFAULT_SORT,
  };
  const page = Math.max(parseInt(params.get('pagina'), 10) || 1, 1);

  const setFilter = useCallback(
    (name, value) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (value) next.set(name, value);
          else next.delete(name);
          // Cambiar un filtro vuelve a la primera página.
          if (name !== 'pagina') next.delete('pagina');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setPage = useCallback((value) => setFilter('pagina', value > 1 ? String(value) : ''), [setFilter]);
  const clearFilters = useCallback(() => setParams({}, { replace: true }), [setParams]);

  return { filters, page, setPage, setFilter, clearFilters };
}
