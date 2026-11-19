import styles from './StatCard.module.css';

// Una cifra importante con su etiqueta. Con tone="warn" se marca con un punto ámbar: pide atención sin pintar todo el recuadro.
export default function StatCard({ label, value, hint, tone }) {
  return (
    <div className={styles.cell}>
      <span className={styles.label}>
        {tone === 'warn' && <span className={styles.dot} aria-label="Requiere atención" />}
        {label}
      </span>
      <strong className={styles.value}>{value}</strong>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
