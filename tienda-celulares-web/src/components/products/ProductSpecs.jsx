import styles from './ProductSpecs.module.css';

export default function ProductSpecs({ specs }) {
  if (specs.length === 0) return null;

  return (
    <section aria-labelledby="specs-title">
      <h2 id="specs-title" className={styles.title}>
        Especificaciones
      </h2>
      <dl className={styles.list}>
        {specs.map(({ label, value }) => (
          <div key={label} className={styles.row}>
            <dt className={styles.label}>{label}</dt>
            <dd className={styles.value}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
