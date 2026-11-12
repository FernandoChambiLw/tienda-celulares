import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { site } from '../../config/site';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import Logo from './Logo';
import styles from './Header.module.css';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/promociones', label: 'Promociones' },
  { to: '/contacto', label: 'Contacto' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Logo onClick={close} />

        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>

        <nav id="main-nav" className={`${styles.nav} ${open ? styles.navOpen : ''}`}>
          {LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={close}
              className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
            >
              {label}
            </NavLink>
          ))}
          <a
            className={`btn btn--primary btn--small ${styles.cta}`}
            href={buildWhatsAppLink(site.whatsapp, 'Hola, quisiera hacer una consulta.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}
