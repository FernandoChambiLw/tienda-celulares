import { formatBs } from '../../utils/format';
import styles from './SalesBars.module.css';

// Barras simples (solo CSS, sin librerías). items: [{ key, label, total }].
export default function SalesBars({ items, ariaLabel }) {
  const max = Math.max(1, ...items.map((d) => Number(d.total)));
  return (
    <ul className={styles.chart} aria-label={ariaLabel}>
      {items.map((d) => (
        <li key={d.key} className={styles.col}>
          <span className={styles.amount}>{formatBs(Number(d.total))}</span>
          <span className={styles.bar} style={{ height: `${(Number(d.total) / max) * 100}%` }} />
          <span className={styles.day}>{d.label}</span>
        </li>
      ))}
    </ul>
  );
}
