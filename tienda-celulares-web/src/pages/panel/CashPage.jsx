import { useState } from 'react';
import { cashApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import Pill from '../../components/panel/Pill';
import StatCard from '../../components/panel/StatCard';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatBs } from '../../utils/format';
import { formatDateTime } from '../../utils/panelFormat';

// Resumen imprimible de una caja (abierta o cerrada).
function CashSummary({ caja }) {
  return (
    <div className="box">
      <div className="columns is-multiline">
        <div className="column is-3"><StatCard label="Monto inicial" value={formatBs(caja.monto_inicial)} /></div>
        <div className="column is-3"><StatCard label="Cobrado (todos los métodos)" value={formatBs(caja.total_cobrado)} /></div>
        <div className="column is-3"><StatCard label="Efectivo cobrado" value={formatBs(caja.efectivo_cobrado)} /></div>
        <div className="column is-3"><StatCard label="Efectivo esperado en caja" value={formatBs(caja.esperado_calculado)} hint="Inicial + efectivo + ingresos − egresos" /></div>
      </div>
      <h3 className="title is-6">Cobros por método de pago</h3>
      <table className="table is-fullwidth is-narrow">
        <tbody>
          {caja.cobros.map((c) => <tr key={c.metodo}><td>{c.metodo}</td><td>{c.operaciones} cobros</td><td className="has-text-right">{formatBs(c.total)}</td></tr>)}
          {!caja.cobros.length && <tr><td className="has-text-grey">Todavía no hay cobros desde la apertura.</td></tr>}
        </tbody>
      </table>
      {caja.movimientos.length > 0 && (
        <>
          <h3 className="title is-6">Ingresos y egresos manuales</h3>
          <table className="table is-fullwidth is-narrow">
            <tbody>
              {caja.movimientos.map((m) => (
                <tr key={m.id_movimiento}>
                  <td>{formatDateTime(m.fecha_hora)}</td><td>{m.concepto}</td>
                  <td className="has-text-right">{m.tipo === 'Egreso' ? '−' : '+'}{formatBs(m.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {caja.estado === 'Cerrada' && (
        <p>
          Contado: <strong>{formatBs(caja.monto_contado)}</strong> · Diferencia:{' '}
          <Pill tone={caja.diferencia === 0 ? 'ok' : 'danger'}>{caja.diferencia === 0 ? 'Cuadra' : formatBs(caja.diferencia)}</Pill>
          {caja.observacion && <span className="has-text-grey"> — {caja.observacion}</span>}
        </p>
      )}
    </div>
  );
}

export default function CashPage() {
  usePageTitle('Caja');
  const current = useAsync(() => cashApi.current(), []);
  const history = useAsync(() => cashApi.list({ limit: 50 }), []);
  const [initial, setInitial] = useState('');
  const [move, setMove] = useState({ tipo: 'Egreso', monto: '', concepto: '' });
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  const run = async (fn) => {
    setBusy(true);
    setFailure('');
    try { await fn(); current.reload(); history.reload(); } catch (e) { setFailure(e.message); } finally { setBusy(false); }
  };

  const caja = current.data;
  const columns = [
    { key: 'id_caja', header: 'N°' },
    { key: 'apertura', header: 'Apertura', render: (r) => formatDateTime(r.apertura) },
    { key: 'empleado', header: 'Cajero' },
    { key: 'monto_esperado', header: 'Esperado', align: 'right', render: (r) => (r.monto_esperado == null ? '—' : formatBs(r.monto_esperado)) },
    { key: 'monto_contado', header: 'Contado', align: 'right', render: (r) => (r.monto_contado == null ? '—' : formatBs(r.monto_contado)) },
    { key: 'diferencia', header: 'Diferencia', align: 'right', render: (r) => (r.diferencia == null ? '—' : <Pill tone={r.diferencia === 0 ? 'ok' : 'danger'}>{formatBs(r.diferencia)}</Pill>) },
    { key: 'estado', header: 'Estado', render: (r) => <Pill tone={r.estado === 'Abierta' ? 'warn' : 'ok'}>{r.estado}</Pill> },
    { key: 'ver', header: '', render: (r) => <button type="button" className="button is-small is-primary is-outlined is-rounded" onClick={async () => setViewing(await cashApi.get(r.id_caja))}>Ver</button> },
  ];

  return (
    <>
      <PageHeader title="Caja diaria" subtitle="Abre la caja al empezar, registra gastos y ciérrala al terminar: el sistema calcula cuánto efectivo debe haber." />
      {failure && <p className="notification is-danger is-light" role="alert">{failure}</p>}
      <AsyncView loading={current.loading} error={current.error} onRetry={current.reload}>
        {!caja ? (
          <form className="box" onSubmit={(e) => { e.preventDefault(); run(() => cashApi.open(Number(initial))); }}>
            <h2 className="title is-5">Abrir caja</h2>
            <div className="field has-addons">
              <div className="control is-expanded">
                <input className="input" type="number" min="0" step="0.01" required placeholder="Efectivo con el que empiezas (Bs)" value={initial} onChange={(e) => setInitial(e.target.value)} aria-label="Monto inicial" />
              </div>
              <div className="control"><button className="button is-primary" disabled={busy}>Abrir caja</button></div>
            </div>
          </form>
        ) : (
          <>
            <p className="mb-3"><Pill tone="warn">Caja abierta</Pill> <span className="has-text-grey">desde {formatDateTime(caja.apertura)}</span></p>
            <CashSummary caja={caja} />
            <div className="columns">
              <form className="column box" onSubmit={(e) => { e.preventDefault(); run(async () => { await cashApi.move({ ...move, monto: Number(move.monto) }); setMove({ ...move, monto: '', concepto: '' }); }); }}>
                <h2 className="title is-6">Ingreso / egreso manual</h2>
                <div className="field has-addons">
                  <div className="control"><div className="select"><select value={move.tipo} onChange={(e) => setMove({ ...move, tipo: e.target.value })} aria-label="Tipo"><option>Egreso</option><option>Ingreso</option></select></div></div>
                  <div className="control"><input className="input" type="number" min="0.01" step="0.01" required placeholder="Monto" value={move.monto} onChange={(e) => setMove({ ...move, monto: e.target.value })} aria-label="Monto" /></div>
                </div>
                <input className="input mb-2" required placeholder="Concepto (pasajes, almuerzo, cambio...)" value={move.concepto} onChange={(e) => setMove({ ...move, concepto: e.target.value })} aria-label="Concepto" />
                <button className="button is-primary is-outlined" disabled={busy}>Registrar</button>
              </form>
              <form className="column box" onSubmit={(e) => { e.preventDefault(); if (window.confirm('¿Cerrar la caja?')) run(async () => { const closed = await cashApi.close({ monto_contado: Number(counted), observacion: note }); setCounted(''); setNote(''); setViewing(closed); }); }}>
                <h2 className="title is-6">Cerrar caja</h2>
                <input className="input mb-2" type="number" min="0" step="0.01" required placeholder="Efectivo que contaste (Bs)" value={counted} onChange={(e) => setCounted(e.target.value)} aria-label="Efectivo contado" />
                <input className="input mb-2" placeholder="Observación (opcional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Observación" />
                <button className="button is-danger" disabled={busy}>Cerrar caja</button>
              </form>
            </div>
          </>
        )}
      </AsyncView>

      {viewing && (
        <div className="modal is-active" role="dialog" aria-modal="true">
          <div className="modal-background" onClick={() => setViewing(null)} />
          <div className="modal-card" style={{ width: 'min(760px, 96vw)' }}>
            <header className="modal-card-head"><p className="modal-card-title">Caja N° {viewing.id_caja} · {viewing.empleado}</p><button type="button" className="delete" aria-label="Cerrar" onClick={() => setViewing(null)} /></header>
            <section className="modal-card-body"><CashSummary caja={viewing} /></section>
            <footer className="modal-card-foot"><button type="button" className="button is-primary is-rounded" onClick={() => window.print()}>Imprimir</button></footer>
          </div>
        </div>
      )}

      <h2 className="title is-5 mt-5">Historial</h2>
      <AsyncView loading={history.loading} error={history.error} onRetry={history.reload}>
        <DataTable title="cajas" rowKey="id_caja" rows={history.data ?? []} columns={columns} emptyTitle="Sin cajas" emptyMessage="Aún no abriste ninguna caja." />
      </AsyncView>
    </>
  );
}
