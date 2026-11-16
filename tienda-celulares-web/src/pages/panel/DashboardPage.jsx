import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import AdminSummary from '../../components/panel/AdminSummary';
import StockAlerts from '../../components/panel/StockAlerts';
import PageHeader from '../../components/ui/PageHeader';
import { ROLES } from '../../config/panel';
import { usePageTitle } from '../../hooks/usePageTitle';

const alreadyChanged = () => {
  try {
    return window.localStorage.getItem('fx-clave-cambiada') === '1';
  } catch {
    return false;
  }
};

export default function DashboardPage() {
  usePageTitle('Resumen');
  const { user } = useAuth();
  const [hideTip, setHideTip] = useState(alreadyChanged());
  const isAdmin = user.rol === ROLES.admin;

  return (
    <>
      <PageHeader title={`Hola, ${user.nombre.split(' ')[0]}`} subtitle={isAdmin ? 'Así va el negocio.' : 'Esto es lo que necesita atención.'} />
      {!hideTip && (
        <div className="notification is-warning is-light no-print" role="note">
          <button type="button" className="delete" aria-label="Cerrar aviso" onClick={() => setHideTip(true)} />
          Estás usando una cuenta de prueba. Por seguridad, cambia tu contraseña desde «Cambiar contraseña» en el menú lateral.
        </div>
      )}
      {user.rol === ROLES.seller && (
        <p style={{ marginBottom: 24 }}>
          <Link className="button is-primary is-rounded" to="/panel/ventas/nueva">Registrar una venta</Link>
        </p>
      )}
      {isAdmin ? (
        <AdminSummary />
      ) : (
        <>
          <h2 style={{ marginBottom: 12, fontSize: '1.15rem' }}>Stock por reponer</h2>
          <StockAlerts />
        </>
      )}
    </>
  );
}
