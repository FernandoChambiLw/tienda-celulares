import { Link } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Página no encontrada');

  return (
    <div className="container">
      <EmptyState title="Página no encontrada" message="La dirección que buscas no existe.">
        <Link to="/" className="button is-primary is-rounded">
          Ir al inicio
        </Link>
      </EmptyState>
    </div>
  );
}
