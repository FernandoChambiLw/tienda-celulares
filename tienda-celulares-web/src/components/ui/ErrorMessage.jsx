import { ApiError } from '../../api/httpClient';
import styles from './ErrorMessage.module.css';

const NETWORK_MESSAGE =
  'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

export default function ErrorMessage({ error, onRetry }) {
  const message = error instanceof ApiError ? error.message : NETWORK_MESSAGE;

  return (
    <div className={styles.box} role="alert">
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--ghost" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
