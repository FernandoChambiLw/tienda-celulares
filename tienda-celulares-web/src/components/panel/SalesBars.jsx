import { formatBs } from '../../utils/format';
import { formatDayMonth } from '../../utils/panelFormat';
import styles from './SalesBars.module.css';

// Barras simples (solo CSS, sin librerías) con las ventas de cada día.
export default function SalesBars({ days }) {
  const max = Math.max(1, ...days.map((d) => Number(d.total)));
  return (
    <ul className={styles.chart} aria-label="Ventas de los últimos 7 días">
      {days.map((d) => (
        <li key={d.dia} className={styles.col}>
          <span className={styles.amount}>{formatBs(Number(d.total))}</span>
          <span className={styles.bar} style={{ height: `${(Number(d.total) / max) * 100}%` }} />
          <span className={styles.day}>{formatDayMonth(d.dia)}</span>
        </li>
      ))}
    </ul>
  );
}
