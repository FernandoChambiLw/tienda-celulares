import { Link } from 'react-router-dom';
import { site } from '../../config/site';
import styles from './Logo.module.css';

// Logo de FX TECHNOLOGY (public/logo-192.png) junto al nombre de la tienda.
export default function Logo({ onClick, className = '' }) {
  return (
    <Link to="/" className={`${styles.logo} ${className}`} onClick={onClick} aria-label={`${site.name} - inicio`}>
      <img className={styles.mark} src="/logo-192.png" alt="" width="40" height="40" />
      <span>{site.name}</span>
    </Link>
  );
}
