import { ApiError } from '../../api/httpClient';

const NETWORK_MESSAGE =
  'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

export default function ErrorMessage({ error, onRetry }) {
  const message = error instanceof ApiError ? error.message : NETWORK_MESSAGE;

  return (
    <div className="notification is-danger is-light" role="alert">
      <p className="mb-3">{message}</p>
      {onRetry && (
        <button type="button" className="button is-danger is-outlined is-small is-rounded" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
