import ProductFilters from '../components/products/ProductFilters';
import ProductGrid from '../components/products/ProductGrid';
import AsyncView from '../components/ui/AsyncView';
import PageHeader from '../components/ui/PageHeader';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import { useCatalogMeta } from '../hooks/useCatalogMeta';
import { usePageTitle } from '../hooks/usePageTitle';
import { useProducts } from '../hooks/useProducts';
import styles from './CatalogPage.module.css';

export default function CatalogPage() {
  usePageTitle('Catálogo');

  const { filters, setFilter, clearFilters } = useCatalogFilters();
  const meta = useCatalogMeta();
  const products = useProducts(filters);

  return (
    <div className="container">
      <PageHeader title="Catálogo" subtitle="Celulares, accesorios y dispositivos con garantía." />

      <ProductFilters
        filters={filters}
        options={meta.data}
        onChange={setFilter}
        onClear={clearFilters}
      />

      <AsyncView loading={products.loading} error={products.error} onRetry={products.reload}>
        {products.data && (
          <>
            <p className={styles.count} aria-live="polite">
              {products.data.length} {products.data.length === 1 ? 'producto' : 'productos'}
            </p>
            <ProductGrid products={products.data} />
          </>
        )}
      </AsyncView>
    </div>
  );
}
