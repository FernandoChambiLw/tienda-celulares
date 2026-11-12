import { Suspense, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PANEL_NAV, canAccess, roleLabel } from '../../config/panel';
import { site } from '../../config/site';
import Spinner from '../ui/Spinner';
import styles from './PanelLayout.module.css';

// Marco del panel interno: barra lateral con las secciones permitidas para el rol.
export default function PanelLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = PANEL_NAV.filter((item) => canAccess(user.rol, item.roles));

  const exit = () => {
    logout();
    navigate('/panel/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <aside className={`${styles.side} ${open ? styles.sideOpen : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandName}>{site.name}</span>
          <span className={styles.brandTag}>Panel interno</span>
        </div>

        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="panel-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>

        <nav id="panel-nav" className={styles.nav}>
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.user}>
          <strong>{user.nombre}</strong>
          <span>{roleLabel(user.rol)}</span>
          <div className={styles.userActions}>
            <NavLink to="/" className={styles.small}>Ver tienda</NavLink>
            <button type="button" className={styles.small} onClick={exit}>Salir</button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
