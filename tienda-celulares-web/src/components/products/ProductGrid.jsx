import EmptyState from '../ui/EmptyState';
import ProductCard from './ProductCard';

// Cuadrícula con las `columns` de Bulma: 1 columna en celular, 2 en tablet, 3-4 en escritorio.
export default function ProductGrid({ products }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No encontramos productos"
        message="Prueba con otros filtros o con una búsqueda distinta."
      />
    );
  }

  return (
    <div className="columns is-multiline is-variable is-3">
      {products.map((product) => (
        <div key={product.id} className="column is-12-mobile is-6-tablet is-4-desktop is-3-widescreen">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
