import { useMemo } from 'react';
import ProductFilters from '../components/products/ProductFilters';
import ProductGrid from '../components/products/ProductGrid';
import AsyncView from '../components/ui/AsyncView';
import PageHeader from '../components/ui/PageHeader';
import Pagination from '../components/ui/Pagination';
import { PAGE_SIZE } from '../config/catalog';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import { useCatalogMeta } from '../hooks/useCatalogMeta';
import { usePageTitle } from '../hooks/usePageTitle';
import { useProducts } from '../hooks/useProducts';

export default function CatalogPage() {
  usePageTitle('Catálogo');

  const { filters, page, setPage, setFilter, clearFilters } = useCatalogFilters();
  const meta = useCatalogMeta();
  const products = useProducts(filters);

  const total = products.data?.length ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = useMemo(
    () => (products.data ?? []).slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [products.data, current],
  );

  const changePage = (value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            <p className="has-text-grey mb-3" aria-live="polite">
              {total} {total === 1 ? 'producto' : 'productos'}
              {pages > 1 && ` · página ${current} de ${pages}`}
            </p>
            <ProductGrid products={visible} />
            <Pagination page={current} pages={pages} onChange={changePage} />
          </>
        )}
      </AsyncView>
    </div>
  );
}
