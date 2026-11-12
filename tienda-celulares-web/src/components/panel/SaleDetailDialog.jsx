import { useEffect, useRef, useState } from 'react';
import { salesApi } from '../../api/panel/panelApi';
import { useAuth } from '../../auth/AuthContext';
import { ROLES } from '../../config/panel';
import { useAsync } from '../../hooks/useAsync';
import { formatBs } from '../../utils/format';
import { formatDateTime, saleTone } from '../../utils/panelFormat';
import AsyncView from '../ui/AsyncView';
import Pill from './Pill';
import styles from './SaleDetailDialog.module.css';

// Detalle de una venta en un cuadro de diálogo nativo (<dialog>): cierra con Esc.
export default function SaleDetailDialog({ saleId, onClose, onChanged }) {
  const ref = useRef(null);
  const { user } = useAuth();
  const { data: sale, loading, error, reload } = useAsync(() => salesApi.get(saleId), [saleId]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const cancelSale = async () => {
    if (!window.confirm('¿Anular esta venta? El stock y los IMEI vuelven al almacén.')) return;
    setBusy(true);
    setFailure('');
    try {
      await salesApi.cancel(saleId);
      onChanged();
      reload();
    } catch (e) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={ref} className={styles.dialog} onClose={onClose}>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        {sale && (
          <div className={styles.body}>
            <header className={styles.head}>
              <h2>Venta N° {sale.id_venta}</h2>
              <Pill tone={saleTone(sale.estado)}>{sale.estado}</Pill>
            </header>
            <p className={styles.meta}>
              {formatDateTime(sale.fecha_hora)} · {sale.cliente} · {sale.metodo_pago}
              {sale.numero_factura && ` · Factura ${sale.numero_factura}`}
            </p>
            <ul className={styles.items}>
              {sale.items.map((it) => (
                <li key={it.id_producto}>
                  <span>
                    {it.cantidad} × {it.producto}
                    {it.imeis.length > 0 && <small> IMEI: {it.imeis.join(', ')}</small>}
                  </span>
                  <strong>{formatBs(Number(it.subtotal))}</strong>
                </li>
              ))}
            </ul>
            <p className={styles.total}>Total: {formatBs(Number(sale.total))}</p>
            {failure && <p className={styles.error} role="alert">{failure}</p>}
            <footer className={styles.actions}>
              {user.rol === ROLES.admin && sale.estado === 'Completada' && (
                <button type="button" className="btn btn--ghost btn--small" onClick={cancelSale} disabled={busy}>
                  Anular venta
                </button>
              )}
              <button type="button" className="btn btn--primary btn--small" onClick={() => ref.current.close()}>
                Cerrar
              </button>
            </footer>
          </div>
        )}
      </AsyncView>
    </dialog>
  );
}
