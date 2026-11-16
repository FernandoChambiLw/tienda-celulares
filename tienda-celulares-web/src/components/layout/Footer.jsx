import { Link } from 'react-router-dom';
import { site } from '../../config/site';
import Logo from './Logo';
import styles from './Footer.module.css';

// Pie de página con el componente `footer` y las columnas de Bulma.
export default function Footer() {
  return (
    <footer className={`footer ${styles.footer} no-print`}>
      <div className="container">
        <div className="columns">
          <div className="column is-5">
            <Logo />
            <p className={styles.slogan}>{site.slogan}</p>
          </div>

          <div className="column is-3">
            <p className={styles.heading}>Visítanos</p>
            <p className={styles.text}>{site.address}</p>
            <p className={styles.text}>{site.schedule}</p>
          </div>

          <div className="column is-4">
            <p className={styles.heading}>Contacto</p>
            <p className={styles.text}>WhatsApp / Tel. {site.phone}</p>
            {site.email && <p className={styles.text}>{site.email}</p>}
            <Link to="/contacto" className={styles.link}>
              Más formas de contactarnos
            </Link>
            <p>
              <Link to="/panel/login" className={styles.link}>
                Acceso del personal
              </Link>
            </p>
          </div>
        </div>

        <p className={styles.copy}>
          © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
