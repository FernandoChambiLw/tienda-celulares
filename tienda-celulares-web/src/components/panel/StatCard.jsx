import styles from './StatCard.module.css';

// Una cifra importante con su etiqueta (ventas de hoy, bajo stock...).
export default function StatCard({ label, value, hint, tone }) {
  return (
    <div className={`${styles.card} ${tone === 'warn' ? styles.warn : ''}`}>
      <span className={styles.label}>{label}</span>
      <strong className={styles.value}>{value}</strong>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
