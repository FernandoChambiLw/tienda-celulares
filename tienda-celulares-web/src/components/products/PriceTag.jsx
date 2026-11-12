import { formatBs } from '../../utils/format';
import styles from './PriceTag.module.css';

export default function PriceTag({ product, large = false }) {
  const hasDiscount = product.descuento > 0;

  return (
    <div className={styles.wrapper}>
      <span className={large ? styles.finalLarge : styles.final}>
        {formatBs(product.precioFinal)}
      </span>
      {hasDiscount && (
        <>
          <s className={styles.original}>{formatBs(product.precio)}</s>
          <span className={styles.badge}>-{product.descuento}%</span>
        </>
      )}
    </div>
  );
}
