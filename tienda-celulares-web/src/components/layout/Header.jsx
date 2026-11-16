import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { site } from '../../config/site';
import { useCompare } from '../../hooks/useCompare';
import { useShopCart } from '../../hooks/useShopCart';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import Logo from './Logo';
import styles from './Header.module.css';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/promociones', label: 'Promociones' },
  { to: '/reparacion', label: 'Mi reparación' },
  { to: '/contacto', label: 'Contacto' },
];

// Barra de navegación hecha con los componentes `navbar` de Bulma.
export default function Header() {
  const [open, setOpen] = useState(false);
  const compare = useCompare();
  const cart = useShopCart();
  const close = () => setOpen(false);

  return (
    <header className={`${styles.header} no-print`}>
      <nav className="navbar is-black" aria-label="Principal">
        <div className="container">
          <div className="navbar-brand">
            <Logo onClick={close} className="navbar-item" />
            <button
              type="button"
              className={`navbar-burger ${open ? 'is-active' : ''}`}
              aria-label="Abrir o cerrar el menú"
              aria-expanded={open}
              aria-controls="main-nav"
              onClick={() => setOpen((value) => !value)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>

          <div id="main-nav" className={`navbar-menu ${open ? 'is-active' : ''}`}>
            <div className="navbar-start">
              {LINKS.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={close}
                  className={({ isActive }) => `navbar-item ${isActive ? 'is-active' : ''}`}
                >
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="navbar-end">
              <Link to="/carrito" className="navbar-item" onClick={close}>
                Carrito&nbsp;
                <span className={`tag is-rounded ${cart.count ? 'is-primary' : 'is-dark'}`}>{cart.count}</span>
              </Link>
              {compare.ids.length > 0 && (
                <Link to="/comparar" className="navbar-item" onClick={close}>
                  Comparar&nbsp;<span className="tag is-primary is-rounded">{compare.ids.length}</span>
                </Link>
              )}
              <div className="navbar-item">
                <a
                  className="button is-primary is-rounded"
                  href={buildWhatsAppLink(site.whatsapp, 'Hola, quisiera hacer una consulta.')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
