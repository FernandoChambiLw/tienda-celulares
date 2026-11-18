import { Suspense, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PANEL_NAV, canAccess, roleLabel } from '../../config/panel';
import { site } from '../../config/site';
import Spinner from '../ui/Spinner';
import ChangePasswordDialog from './ChangePasswordDialog';
import styles from './PanelLayout.module.css';

// Marco del panel interno: menú lateral (`menu` de Bulma) con las secciones permitidas para el rol.
export default function PanelLayout() {
  const { user, logout, passwordChanged } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const links = PANEL_NAV.filter((item) => canAccess(user.rol, item.roles));

  const exit = () => {
    logout();
    navigate('/panel/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <aside className={`${styles.side} ${open ? styles.sideOpen : ''} no-print`}>
        <div className={styles.brand}>
          <img src="/logo-192.png" alt="" width="40" height="40" className={styles.logo} />
          <div>
            <span className={styles.brandName}>{site.name}</span>
            <span className={styles.brandTag}>Panel interno</span>
          </div>
        </div>

        <button
          type="button"
          className={`button is-small is-rounded is-outlined is-white ${styles.toggle}`}
          aria-expanded={open}
          aria-controls="panel-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>

        <nav id="panel-nav" className={`menu ${styles.nav}`} aria-label="Panel">
          <ul className="menu-list">
            {links.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.user}>
          <strong>{user.nombre}</strong>
          <span className="tag is-primary is-light is-rounded">{roleLabel(user.rol)}</span>
          <div className={styles.userActions}>
            <NavLink to="/" className={styles.small}>Ver tienda</NavLink>
            <button type="button" className={styles.small} onClick={() => setChangingPassword(true)}>Cambiar contraseña</button>
            <button type="button" className={styles.small} onClick={exit}>Salir</button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        {/* Con la clave inicial pendiente no se carga nada: solo el aviso para cambiarla. */}
        {!user.debe_cambiar_clave && (
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        )}
      </main>

      {user.debe_cambiar_clave && (
        <ChangePasswordDialog forced onClose={() => {}} onChanged={(result) => {
          try { window.localStorage.setItem('fx-clave-cambiada', '1'); } catch { /* sin almacenamiento */ }
          passwordChanged(result);
        }} />
      )}
      {changingPassword && !user.debe_cambiar_clave && (
        <ChangePasswordDialog
          onClose={() => setChangingPassword(false)}
          onChanged={(result) => {
            passwordChanged(result);
            try {
              window.localStorage.setItem('fx-clave-cambiada', '1');
            } catch {
              /* sin almacenamiento: el aviso del resumen simplemente seguirá apareciendo */
            }
          }}
        />
      )}
    </div>
  );
}
