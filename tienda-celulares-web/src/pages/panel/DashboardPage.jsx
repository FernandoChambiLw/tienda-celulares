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
        <div className="notification is-warning is-light no-print mb-4" role="note" style={{ borderLeft: "3px solid var(--amber-500)", borderRadius: "0 6px 6px 0" }}>
          <button type="button" className="delete" aria-label="Cerrar aviso" onClick={() => setHideTip(true)} />
          Estás usando una cuenta de prueba. Por seguridad, cambia tu contraseña desde «Cambiar contraseña» en el menú lateral.
        </div>
      )}
      {user.rol === ROLES.seller && (
        <p style={{ marginBottom: 24 }}>
          <Link className="button is-primary" to="/panel/ventas/nueva">Registrar una venta</Link>
        </p>
      )}
      {isAdmin ? (
        <AdminSummary />
      ) : (
        <>
          <h2 style={{ marginBottom: 12, fontFamily: 'var(--font)', fontSize: '1rem', fontWeight: 650, letterSpacing: '-0.01em' }}>Stock por reponer</h2>
          <StockAlerts />
        </>
      )}
    </>
  );
}
