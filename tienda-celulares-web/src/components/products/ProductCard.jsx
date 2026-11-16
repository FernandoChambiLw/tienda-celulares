import { Link } from 'react-router-dom';
import { useCompare } from '../../hooks/useCompare';
import { useShopCart } from '../../hooks/useShopCart';
import PriceTag from './PriceTag';
import ProductImage from './ProductImage';
import StockBadge from './StockBadge';
import styles from './ProductCard.module.css';

// Tarjeta hecha con el componente `card` de Bulma. El botón "Comparar" suma el producto al comparador.
export default function ProductCard({ product }) {
  const compare = useCompare();
  const cart = useShopCart();
  const chosen = compare.has(product.id);

  return (
    <article className={`card ${styles.card}`}>
      <Link to={`/catalogo/${product.id}`} className="card-image" aria-label={product.nombre}>
        <div className={styles.media}>
          <ProductImage product={product} />
          {product.descuento > 0 && <span className={styles.ribbon}>-{product.descuento}%</span>}
        </div>
      </Link>

      <div className={`card-content ${styles.body}`}>
        <span className={styles.brand}>{product.marca}</span>
        <h3 className={styles.name}>
          <Link to={`/catalogo/${product.id}`}>{product.nombre}</Link>
        </h3>
        {product.promoNombre && <span className={styles.promo}>{product.promoNombre}</span>}
        <div className={styles.foot}>
          <PriceTag product={product} />
          <StockBadge available={product.disponible} />
        </div>
      </div>

      <footer className="card-footer no-print">
        <button
          type="button"
          className={`card-footer-item button is-ghost ${styles.compare}`}
          onClick={() => cart.add(product)}
          disabled={!product.disponible}
        >
          {cart.has(product.id) ? '＋ Agregar otro' : 'Agregar al carrito'}
        </button>
        <button
          type="button"
          className={`card-footer-item button is-ghost ${styles.compare}`}
          onClick={() => compare.toggle(product.id)}
          disabled={!chosen && compare.full}
          aria-pressed={chosen}
          title={!chosen && compare.full ? 'Puedes comparar hasta 3 productos' : undefined}
        >
          {chosen ? '✓ En comparación' : 'Comparar'}
        </button>
      </footer>
    </article>
  );
}
