import { Link } from 'react-router-dom';
import { site } from '../../config/site';
import Logo from './Logo';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div>
          <Logo light />
          <p className={styles.slogan}>{site.slogan}</p>
        </div>

        <div>
          <p className={styles.heading}>Visítanos</p>
          <p className={styles.text}>{site.address}</p>
          <p className={styles.text}>{site.schedule}</p>
        </div>

        <div>
          <p className={styles.heading}>Contacto</p>
          <p className={styles.text}>Tel. {site.phone}</p>
          <p className={styles.text}>{site.email}</p>
          <Link to="/contacto" className={styles.link}>
            Más formas de contactarnos
          </Link>
        </div>
      </div>

      <p className={`container ${styles.copy}`}>
        © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
      </p>
    </footer>
  );
}
