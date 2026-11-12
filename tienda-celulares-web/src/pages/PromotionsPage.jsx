import ProductGrid from '../components/products/ProductGrid';
import AsyncView from '../components/ui/AsyncView';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import { useOffers } from '../hooks/useOffers';
import { usePageTitle } from '../hooks/usePageTitle';

export default function PromotionsPage() {
  usePageTitle('Promociones');
  const offers = useOffers();

  return (
    <div className="container">
      <PageHeader title="Promociones" subtitle="Productos con descuento vigente, por tiempo limitado." />

      <AsyncView loading={offers.loading} error={offers.error} onRetry={offers.reload}>
        {offers.data?.length === 0 && (
          <EmptyState
            title="Sin promociones por ahora"
            message="Vuelve pronto: publicamos ofertas cada temporada."
          />
        )}
        {offers.data?.length > 0 && <ProductGrid products={offers.data} />}
      </AsyncView>
    </div>
  );
}
