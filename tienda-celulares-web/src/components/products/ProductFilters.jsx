import { useEffect, useState } from 'react';
import { PRODUCT_TYPES, SORT_OPTIONS } from '../../config/catalog';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import SelectField from '../ui/SelectField';
import styles from './ProductFilters.module.css';

// La API entrega marcas y categorías como nombres; el nombre es también el valor del filtro.
const toOptions = (names = []) => names.map((name) => ({ value: name, label: name }));

export default function ProductFilters({ filters, options, onChange, onClear }) {
  const [search, setSearch] = useState(filters.q);
  const debouncedSearch = useDebouncedValue(search, 350);

  // El texto se envía a la URL recién cuando el usuario deja de escribir.
  useEffect(() => {
    if (debouncedSearch !== filters.q) onChange('q', debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Si la URL cambia desde afuera (botón "atrás"), el campo la sigue,
  // salvo que el usuario esté escribiendo en ese momento.
  useEffect(() => {
    setSearch((current) => (current === debouncedSearch ? filters.q : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q]);

  const hasActiveFilters = Boolean(filters.q || filters.tipo || filters.categoria || filters.marca);

  const handleClear = () => {
    setSearch('');
    onClear();
  };

  return (
    <form className={styles.form} role="search" onSubmit={(event) => event.preventDefault()}>
      <div className={styles.search}>
        <label htmlFor="catalog-search" className={styles.label}>
          Buscar
        </label>
        <input
          id="catalog-search"
          type="search"
          className={styles.input}
          placeholder="Ej: Samsung, audífonos, 128GB..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <SelectField
        label="Tipo"
        value={filters.tipo}
        onChange={(value) => onChange('tipo', value)}
        options={PRODUCT_TYPES}
        placeholder="Todos"
      />
      <SelectField
        label="Categoría"
        value={filters.categoria}
        onChange={(value) => onChange('categoria', value)}
        options={toOptions(options?.categorias)}
        placeholder="Todas"
      />
      <SelectField
        label="Marca"
        value={filters.marca}
        onChange={(value) => onChange('marca', value)}
        options={toOptions(options?.marcas)}
        placeholder="Todas"
      />
      <SelectField
        label="Ordenar por"
        value={filters.orden}
        onChange={(value) => onChange('orden', value)}
        options={SORT_OPTIONS}
      />

      {hasActiveFilters && (
        <button type="button" className={`btn btn--ghost ${styles.clear}`} onClick={handleClear}>
          Limpiar filtros
        </button>
      )}
    </form>
  );
}
