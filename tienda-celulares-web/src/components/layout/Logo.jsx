import { Link } from 'react-router-dom';
import { site } from '../../config/site';
import styles from './Logo.module.css';

// Logo provisional. Para usar el real, reemplaza el <svg> por <img src="..." width height />.
export default function Logo({ onClick, light = false }) {
  return (
    <Link
      to="/"
      className={`${styles.logo} ${light ? styles.light : ''}`}
      onClick={onClick}
      aria-label={`${site.name} - inicio`}
    >
      <svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="10" fill="currentColor" />
        <rect x="10.5" y="6" width="11" height="20" rx="3.2" fill="none" stroke="var(--cream)" strokeWidth="2" />
        <circle cx="16" cy="22" r="1.3" fill="var(--green-300)" />
      </svg>
      <span>{site.name}</span>
    </Link>
  );
}
