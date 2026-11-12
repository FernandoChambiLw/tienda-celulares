import styles from './StockBadge.module.css';

export default function StockBadge({ available }) {
  return (
    <span className={`${styles.badge} ${available ? styles.ok : styles.danger}`}>
      {available ? 'Disponible' : 'Agotado'}
    </span>
  );
}
