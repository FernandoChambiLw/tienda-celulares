import ErrorMessage from './ErrorMessage';
import Spinner from './Spinner';

// Decide qué mostrar según el estado de una carga: spinner, error o el contenido.
// Evita repetir el mismo if/else en cada página.
export default function AsyncView({ loading, error, onRetry, children }) {
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} onRetry={onRetry} />;
  return children;
}
