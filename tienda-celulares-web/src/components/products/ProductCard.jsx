import { Link } from 'react-router-dom';
import PriceTag from './PriceTag';
import ProductImage from './ProductImage';
import StockBadge from './StockBadge';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  return (
    <Link to={`/catalogo/${product.id}`} className={styles.card}>
      <div className={styles.media}>
        <ProductImage product={product} />
        {product.descuento > 0 && <span className={styles.ribbon}>-{product.descuento}%</span>}
      </div>

      <div className={styles.body}>
        <span className={styles.brand}>{product.marca}</span>
        <h3 className={styles.name}>{product.nombre}</h3>
        {product.promoNombre && <span className={styles.promo}>{product.promoNombre}</span>}
        <div className={styles.foot}>
          <PriceTag product={product} />
          <StockBadge available={product.disponible} />
        </div>
      </div>
    </Link>
  );
}
