import styles from './Pill.module.css';

// Etiqueta de estado. tone: ok | warn | danger | neutral
export default function Pill({ tone = 'neutral', children }) {
  return <span className={`${styles.pill} ${styles[tone]}`}>{children}</span>;
}
