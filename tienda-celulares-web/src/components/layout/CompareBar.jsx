import { Link, useLocation } from 'react-router-dom';
import { useCompare } from '../../hooks/useCompare';
import styles from './CompareBar.module.css';

// Barra inferior que aparece cuando hay productos elegidos para comparar.
export default function CompareBar() {
  const { ids, clear } = useCompare();
  const { pathname } = useLocation();
  if (ids.length === 0 || pathname === '/comparar') return null;

  return (
    <div className={`${styles.bar} no-print`} role="region" aria-label="Comparador">
      <span>
        {ids.length} {ids.length === 1 ? 'producto elegido' : 'productos elegidos'} para comparar
      </span>
      <div className="buttons">
        <button type="button" className="button is-small is-light is-rounded" onClick={clear}>
          Vaciar
        </button>
        <Link to="/comparar" className="button is-small is-primary is-rounded">
          Comparar ahora
        </Link>
      </div>
    </div>
  );
}
