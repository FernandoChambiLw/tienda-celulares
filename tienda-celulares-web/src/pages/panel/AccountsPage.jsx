import { useState } from 'react';
import { accountsApi, lookupsApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import Pill from '../../components/panel/Pill';
import StatCard from '../../components/panel/StatCard';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { site } from '../../config/site';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatBs } from '../../utils/format';
import { formatDate } from '../../utils/format';
import { formatDateTime } from '../../utils/panelFormat';
import { buildWhatsAppLink } from '../../utils/whatsapp';

function AccountDialog({ id, onClose, onChanged }) {
  const { data: cu, loading, error, reload } = useAsync(() => accountsApi.get(id), [id]);
  const methods = useAsync(() => lookupsApi.paymentMethods(), []);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('1');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  const pay = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFailure('');
    try { await accountsApi.pay(id, { monto: Number(amount), id_metodo_pago: Number(method) }); setAmount(''); onChanged(); reload(); } catch (err) { setFailure(err.message); } finally { setBusy(false); }
  };
  const phone = cu?.cliente_telefono?.replace(/^\+?591/, '').replace(/\D/g, '');

  return (
    <div className="modal is-active" role="dialog" aria-modal="true">
      <div className="modal-background" onClick={onClose} />
      <div className="modal-card">
        <header className="modal-card-head"><p className="modal-card-title">Cuenta N° {id}</p><button type="button" className="delete" aria-label="Cerrar" onClick={onClose} /></header>
        <section className="modal-card-body">
          <AsyncView loading={loading} error={error} onRetry={reload}>
            {cu && (
              <>
                <p><strong>{cu.cliente}</strong> · CI {cu.cliente_ci} · venta N° {cu.id_venta}</p>
                <p className="mb-3">Total {formatBs(cu.total)} · Pagado {formatBs(cu.pagado)} · <strong>Saldo {formatBs(cu.saldo)}</strong> {cu.vence && <span className="has-text-grey">· vence {formatDate(cu.vence)}</span>}</p>
                <table className="table is-fullwidth is-narrow">
                  <thead><tr><th>Fecha</th><th>Método</th><th>Cobró</th><th className="has-text-right">Monto</th></tr></thead>
                  <tbody>{cu.abonos.map((a) => <tr key={a.id_abono}><td>{formatDateTime(a.fecha_hora)}</td><td>{a.metodo_pago}</td><td>{a.cobrador}</td><td className="has-text-right">{formatBs(a.monto)}</td></tr>)}</tbody>
                </table>
                {cu.estado === 'Pendiente' && (
                  <form onSubmit={pay} className="field has-addons">
                    <div className="control"><div className="select"><select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Método de pago">{(methods.data ?? []).map((m) => <option key={m.id_metodo_pago} value={m.id_metodo_pago}>{m.nombre}</option>)}</select></div></div>
                    <div className="control is-expanded"><input className="input" type="number" min="0.01" step="0.01" max={cu.saldo} required placeholder="Monto del abono (Bs)" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Monto del abono" /></div>
                    <div className="control"><button className="button is-primary" disabled={busy}>Cobrar</button></div>
                  </form>
                )}
                {failure && <p className="notification is-danger is-light" role="alert">{failure}</p>}
                {cu.estado === 'Pendiente' && phone && (
                  <a className="button is-light is-rounded is-small" target="_blank" rel="noopener noreferrer"
                    href={buildWhatsAppLink(`591${phone}`, `Hola ${cu.cliente}, te escribimos de ${site.name}. Tu saldo pendiente es ${formatBs(cu.saldo)}. ¡Gracias!`)}>
                    Recordar por WhatsApp
                  </a>
                )}
              </>
            )}
          </AsyncView>
        </section>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  usePageTitle('Por cobrar');
  const [estado, setEstado] = useState('Pendiente');
  const [openId, setOpenId] = useState(null);
  const summary = useAsync(() => accountsApi.summary(), []);
  const list = useAsync(() => accountsApi.list({ estado, limit: 200 }), [estado]);
  const refresh = () => { summary.reload(); list.reload(); };

  const columns = [
    { key: 'id_cuenta', header: 'N°' },
    { key: 'cliente', header: 'Cliente' },
    { key: 'fecha_hora', header: 'Venta', render: (r) => formatDateTime(r.fecha_hora) },
    { key: 'total', header: 'Total', align: 'right', render: (r) => formatBs(r.total) },
    { key: 'saldo', header: 'Saldo', align: 'right', render: (r) => <strong>{formatBs(r.saldo)}</strong> },
    { key: 'vence', header: 'Vence', render: (r) => (r.vence ? formatDate(r.vence) : '—') },
    { key: 'estado', header: 'Estado', render: (r) => <Pill tone={r.estado === 'Pagada' ? 'ok' : r.vencida ? 'danger' : 'warn'}>{r.vencida ? 'Vencida' : r.estado}</Pill> },
    { key: 'ver', header: '', render: (r) => <button type="button" className="button is-small is-primary is-outlined is-rounded" onClick={() => setOpenId(r.id_cuenta)}>{r.estado === 'Pendiente' ? 'Cobrar' : 'Ver'}</button> },
  ];

  return (
    <>
      <PageHeader title="Cuentas por cobrar" subtitle="Ventas a crédito: quién debe, cuánto y desde cuándo. Registra los abonos aquí." />
      <AsyncView loading={summary.loading} error={summary.error} onRetry={summary.reload}>
        {summary.data && (
          <div className="columns">
            <div className="column"><StatCard label="Por cobrar" value={formatBs(summary.data.por_cobrar)} hint={`${summary.data.cuentas} cuentas`} /></div>
            <div className="column"><StatCard label="Vencidas" value={summary.data.vencidas} tone={summary.data.vencidas ? 'warn' : undefined} /></div>
            <div className="column"><StatCard label="Mayor deudor" value={summary.data.clientes[0]?.cliente ?? '—'} hint={summary.data.clientes[0] && formatBs(summary.data.clientes[0].saldo)} /></div>
          </div>
        )}
      </AsyncView>
      <div className="select mb-3"><select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado"><option>Pendiente</option><option>Pagada</option></select></div>
      <AsyncView loading={list.loading} error={list.error} onRetry={list.reload}>
        <DataTable title="cuentas_por_cobrar" rowKey="id_cuenta" rows={list.data ?? []} columns={columns} emptyTitle="Sin cuentas" emptyMessage="No hay cuentas con este filtro. Las ventas a crédito se registran en Nueva venta." />
      </AsyncView>
      {openId && <AccountDialog id={openId} onClose={() => setOpenId(null)} onChanged={refresh} />}
    </>
  );
}
