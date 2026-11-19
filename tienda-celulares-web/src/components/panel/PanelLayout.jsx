import { Suspense, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PANEL_NAV, canAccess, roleLabel } from '../../config/panel';
import { site } from '../../config/site';
import Spinner from '../ui/Spinner';
import ChangePasswordDialog from './ChangePasswordDialog';
import Icon from './Icon';
import styles from './PanelLayout.module.css';

// Marco del panel interno: menú lateral (`menu` de Bulma) con las secciones permitidas para el rol.
export default function PanelLayout() {
  const { user, logout, passwordChanged } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const links = PANEL_NAV.filter((item) => canAccess(user.rol, item.roles));
  // Agrupa respetando el orden: cada cambio de grupo abre una sección nueva del menú.
  const groups = links.reduce((acc, item) => {
    const last = acc[acc.length - 1];
    if (last && last.name === (item.group ?? null)) last.items.push(item);
    else acc.push({ name: item.group ?? null, items: [item] });
    return acc;
  }, []);

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
          className={`button is-small is-outlined is-white ${styles.toggle}`}
          aria-expanded={open}
          aria-controls="panel-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>

        <nav id="panel-nav" className={`menu ${styles.nav}`} aria-label="Panel">
          {groups.map(({ name, items }) => (
            <div key={name ?? 'inicio'} className={styles.group}>
              {name && <p className={styles.groupName}>{name}</p>}
              <ul className="menu-list">
                {items.map(({ to, label, end, icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                    >
                      <Icon name={icon} />
                      <span>{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.user}>
          <strong>{user.nombre}</strong>
          <span className={styles.role}>{roleLabel(user.rol)}</span>
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
