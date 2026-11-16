import { useEffect, useState } from 'react';
import { PRODUCT_TYPES, SORT_OPTIONS } from '../../config/catalog';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import SelectField from '../ui/SelectField';

// La API entrega marcas y categorías como nombres; el nombre es también el valor del filtro.
const toOptions = (names = []) => names.map((name) => ({ value: name, label: name }));

// Campo de texto que envía su valor a la URL recién cuando el usuario deja de escribir.
function useDebouncedFilter(name, current, onChange, delay) {
  const [local, setLocal] = useState(current);
  const debounced = useDebouncedValue(local, delay);

  useEffect(() => {
    if (debounced !== current) onChange(name, debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // Si la URL cambia desde afuera (botón "atrás"), el campo la sigue,
  // salvo que el usuario esté escribiendo en ese momento.
  useEffect(() => {
    setLocal((value) => (value === debounced ? current : value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return [local, setLocal];
}

// Filtros del catálogo con `field`, `input`, `select` y `box` de Bulma.
export default function ProductFilters({ filters, options, onChange, onClear }) {
  const [search, setSearch] = useDebouncedFilter('q', filters.q, onChange, 350);
  const [min, setMin] = useDebouncedFilter('min', filters.min, onChange, 500);
  const [max, setMax] = useDebouncedFilter('max', filters.max, onChange, 500);

  const hasActiveFilters = Boolean(
    filters.q || filters.tipo || filters.categoria || filters.marca || filters.min || filters.max,
  );

  const handleClear = () => {
    setSearch('');
    setMin('');
    setMax('');
    onClear();
  };

  return (
    <form className="box mb-5" role="search" onSubmit={(event) => event.preventDefault()}>
      <div className="columns is-multiline is-variable is-2">
        <div className="column is-12">
          <div className="field mb-0">
            <label htmlFor="catalog-search" className="label is-small">
              Buscar
            </label>
            <div className="control">
              <input
                id="catalog-search"
                type="search"
                className="input"
                placeholder="Ej: Samsung, audífonos, 128GB..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="column is-6-mobile is-4-tablet is-2-desktop">
          <SelectField
            label="Tipo"
            value={filters.tipo}
            onChange={(value) => onChange('tipo', value)}
            options={PRODUCT_TYPES}
            placeholder="Todos"
          />
        </div>
        <div className="column is-6-mobile is-4-tablet is-2-desktop">
          <SelectField
            label="Categoría"
            value={filters.categoria}
            onChange={(value) => onChange('categoria', value)}
            options={toOptions(options?.categorias)}
            placeholder="Todas"
          />
        </div>
        <div className="column is-6-mobile is-4-tablet is-2-desktop">
          <SelectField
            label="Marca"
            value={filters.marca}
            onChange={(value) => onChange('marca', value)}
            options={toOptions(options?.marcas)}
            placeholder="Todas"
          />
        </div>
        <div className="column is-6-mobile is-6-tablet is-3-desktop">
          <div className="field">
            <label className="label is-small" htmlFor="price-min">
              Precio (Bs)
            </label>
            <div className="field has-addons mb-0">
              <div className="control is-expanded">
                <input
                  id="price-min"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  className="input"
                  placeholder="Desde"
                  aria-label="Precio mínimo"
                  value={min}
                  onChange={(event) => setMin(event.target.value)}
                />
              </div>
              <div className="control is-expanded">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  className="input"
                  placeholder="Hasta"
                  aria-label="Precio máximo"
                  value={max}
                  onChange={(event) => setMax(event.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="column is-12-mobile is-6-tablet is-3-desktop">
          <SelectField
            label="Ordenar por"
            value={filters.orden}
            onChange={(value) => onChange('orden', value)}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button type="button" className="button is-primary is-outlined is-small is-rounded" onClick={handleClear}>
          Limpiar filtros
        </button>
      )}
    </form>
  );
}
