import Illustration from '../products/Illustration';
import styles from './HeroArt.module.css';

// Composición decorativa hecha solo con SVG y CSS: no descarga ninguna imagen.
export default function HeroArt() {
  return (
    <div className={styles.art} aria-hidden="true">
      <span className={styles.blob} />
      <Illustration className={`${styles.phone} ${styles.left}`} kind="phone" color="#1b2230" />
      <Illustration className={`${styles.phone} ${styles.right}`} kind="phone" color="#c8541f" />
      <Illustration className={`${styles.phone} ${styles.center}`} kind="phone" color="#139069" />
      <span className={`${styles.chip} ${styles.chipTop}`}>12 meses de garantía</span>
      <span className={`${styles.chip} ${styles.chipBottom}`}>Servicio técnico propio</span>
    </div>
  );
}
