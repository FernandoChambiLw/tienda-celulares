import { getIllustrationKind, resolveColor, TONE_BY_TYPE } from '../../utils/illustration';
import Illustration from './Illustration';
import styles from './ProductImage.module.css';

// Muestra la foto del producto; si todavía no tiene, una ilustración con su color real.
export default function ProductImage({ product }) {
  const tone = TONE_BY_TYPE[product.tipo] ?? 'green';

  if (product.fotoUrl) {
    return (
      <div className={`${styles.frame} ${styles[tone]}`}>
        <img
          className={styles.photo}
          src={product.fotoUrl}
          alt={product.nombre}
          width="800"
          height="640"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div className={`${styles.frame} ${styles[tone]}`} role="img" aria-label={product.nombre}>
      <span className={styles.blob} aria-hidden="true" />
      <Illustration
        className={styles.art}
        kind={getIllustrationKind(product)}
        color={resolveColor(product.color)}
      />
    </div>
  );
}
