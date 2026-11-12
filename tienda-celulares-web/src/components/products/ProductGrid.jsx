import EmptyState from '../ui/EmptyState';
import ProductCard from './ProductCard';
import styles from './ProductGrid.module.css';

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
    <ul className={styles.grid}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
