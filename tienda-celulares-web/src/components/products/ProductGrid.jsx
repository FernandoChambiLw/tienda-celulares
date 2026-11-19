import EmptyState from '../ui/EmptyState';
import ProductCard from './ProductCard';
import styles from './ProductGrid.module.css';

// Mosaico con grid: 1 columna en celular, 2 en tablet, 3-4 en escritorio. Las tarjetas se tocan (líneas compartidas).
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
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
