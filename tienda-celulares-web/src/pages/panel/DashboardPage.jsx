import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import AdminSummary from '../../components/panel/AdminSummary';
import StockAlerts from '../../components/panel/StockAlerts';
import PageHeader from '../../components/ui/PageHeader';
import { ROLES } from '../../config/panel';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function DashboardPage() {
  usePageTitle('Resumen');
  const { user } = useAuth();
  const isAdmin = user.rol === ROLES.admin;

  return (
    <>
      <PageHeader title={`Hola, ${user.nombre.split(' ')[0]}`} subtitle={isAdmin ? 'Así va el negocio.' : 'Esto es lo que necesita atención.'} />
      {user.rol === ROLES.seller && (
        <p style={{ marginBottom: 24 }}>
          <Link className="btn btn--primary" to="/panel/ventas/nueva">Registrar una venta</Link>
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
