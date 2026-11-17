import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import Pill from '../../components/panel/Pill';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import { site } from '../../config/site';
import { formatBs } from '../../utils/format';
import { formatDateTime } from '../../utils/panelFormat';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import styles from './Panel.module.css';

const TONE = { Nuevo: 'warn', Confirmado: 'neutral', Entregado: 'ok', Cancelado: 'danger' };
const ACTION_LABEL = { Confirmado: 'Confirmar pedido', Entregado: 'Marcar entregado', Cancelado: 'Cancelar pedido' };

// Detalle de un pedido con los botones para avanzar su estado.
function OrderDetail({ id, onClose, onChanged }) {
  const { data: order, loading, error, reload } = useAsync(() => ordersApi.get(id), [id]);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  const move = async (estado) => {
    if (estado === 'Cancelado' && !window.confirm('¿Cancelar este pedido?')) return;
    setBusy(true);
    setFailure('');
    try {
      await ordersApi.setStatus(id, estado);
      onChanged();
      reload();
    } catch (e) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal is-active" role="dialog" aria-modal="true" aria-labelledby="order-title">
      <div className="modal-background" onClick={onClose} />
      <div className="modal-card">
        <header className="modal-card-head">
          <p id="order-title" className="modal-card-title">Pedido N° {id}</p>
          <button type="button" className="delete" aria-label="Cerrar" onClick={onClose} />
        </header>
        <section className="modal-card-body">
          <AsyncView loading={loading} error={error} onRetry={reload}>
            {order && (
              <>
                <p className="mb-2"><Pill tone={TONE[order.estado]}>{order.estado}</Pill> <span className="has-text-grey ml-2">{formatDateTime(order.fecha_hora)}</span></p>
                <p><strong>{order.nombre_cliente}</strong> · {order.telefono}{order.ci && ` · CI ${order.ci}`}</p>
                {order.notas && <p className="has-text-grey">Notas: {order.notas}</p>}
                <table className="table is-fullwidth mt-3">
                  <tbody>
                    {order.items.map((it) => (
                      <tr key={it.id_producto}>
                        <td>{it.cantidad} × {it.producto}</td>
                        <td className="has-text-right">{formatBs(Number(it.subtotal))}</td>
                      </tr>
                    ))}
                    <tr>
                      <th>Total</th>
                      <th className="has-text-right">{formatBs(Number(order.total))}</th>
                    </tr>
                  </tbody>
                </table>
                {order.atendido_por && <p className="help">Último cambio por: {order.atendido_por}</p>}
                <p className="help">Al confirmar, reserva el stock a mano; el stock se descuenta cuando registras la venta.</p>
                {failure && <p className="notification is-danger is-light mt-3" role="alert">{failure}</p>}
              </>
            )}
          </AsyncView>
        </section>
        <footer className="modal-card-foot" style={{ flexWrap: 'wrap', gap: 8 }}>
          {order?.siguientes.map((estado) => (
            <button key={estado} type="button" className={`button is-rounded ${estado === 'Cancelado' ? 'is-danger is-outlined' : 'is-primary'}`} disabled={busy} onClick={() => move(estado)}>
              {ACTION_LABEL[estado]}
            </button>
          ))}
          {order && ['Nuevo', 'Confirmado'].includes(order.estado) && (
            <button type="button" className="button is-rounded is-link" onClick={() => navigate('/panel/ventas/nueva', { state: { order } })}>
              Registrar venta
            </button>
          )}
          {order && (
            <a
              className="button is-rounded is-light"
              href={buildWhatsAppLink(`591${order.telefono.replace(/^\+?591/, '').replace(/\D/g, '')}`, `Hola ${order.nombre_cliente}, te escribimos de ${site.name} por tu pedido N° ${order.id_pedido}.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escribir al cliente
            </a>
          )}
        </footer>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  usePageTitle('Pedidos');
  const [estado, setEstado] = useState('');
  const [openId, setOpenId] = useState(null);
  const { data, loading, error, reload } = useAsync(() => ordersApi.list({ estado }), [estado]);

  const columns = [
    { key: 'id_pedido', header: 'N°' },
    { key: 'fecha_hora', header: 'Fecha', render: (r) => formatDateTime(r.fecha_hora) },
    { key: 'nombre_cliente', header: 'Cliente' },
    { key: 'telefono', header: 'Teléfono' },
    { key: 'unidades', header: 'Unid.', align: 'right' },
    { key: 'total', header: 'Total', align: 'right', render: (r) => formatBs(Number(r.total)) },
    { key: 'estado', header: 'Estado', render: (r) => <Pill tone={TONE[r.estado]}>{r.estado}</Pill> },
    { key: 'ver', header: '', render: (r) => <button type="button" className="button is-primary is-outlined is-small is-rounded" onClick={() => setOpenId(r.id_pedido)}>Ver</button> },
  ];

  return (
    <>
      <PageHeader title="Pedidos de la tienda en línea" subtitle="Los pedidos nuevos aparecen primero. Atiéndelos por WhatsApp y cambia su estado." />
      <div className={styles.toolbar}>
        <select className={styles.select} value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado">
          <option value="">Todos</option>
          <option>Nuevo</option>
          <option>Confirmado</option>
          <option>Entregado</option>
          <option>Cancelado</option>
        </select>
      </div>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <DataTable title="pedidos" rowKey="id_pedido" rows={data ?? []} columns={columns} emptyTitle="Sin pedidos" emptyMessage="Todavía no hay pedidos con este filtro." />
      </AsyncView>
      {openId && <OrderDetail id={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
    </>
  );
}
