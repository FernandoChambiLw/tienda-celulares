import Illustration from '../products/Illustration';
import styles from './HeroArt.module.css';

// Composición decorativa hecha solo con SVG y CSS: no descarga ninguna imagen.
// Una losa azul con el corte diagonal del logo sostiene tres equipos de pie.
export default function HeroArt() {
  return (
    <div className={styles.art} aria-hidden="true">
      <span className={styles.slab} />
      <Illustration className={`${styles.phone} ${styles.left}`} kind="phone" color="#1a1f27" />
      <Illustration className={`${styles.phone} ${styles.center}`} kind="phone" color="#e9ecf1" />
      <Illustration className={`${styles.phone} ${styles.right}`} kind="phone" color="#0a0d12" />
      <span className={`${styles.chip} ${styles.chipTop}`}>12 meses de garantía</span>
      <span className={`${styles.chip} ${styles.chipBottom}`}>Servicio técnico propio</span>
    </div>
  );
}
