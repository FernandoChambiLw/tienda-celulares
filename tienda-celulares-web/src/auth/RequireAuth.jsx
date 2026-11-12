import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { canAccess } from '../config/panel';
import { useAuth } from './AuthContext';

// Protege un grupo de rutas: exige sesión y, si se indica, uno de los roles.
export default function RequireAuth({ roles }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Spinner />;
  if (status === 'out') return <Navigate to="/panel/login" replace state={{ from: location.pathname }} />;
  if (roles && !canAccess(user.rol, roles)) return <Navigate to="/panel" replace />;
  return <Outlet />;
}
