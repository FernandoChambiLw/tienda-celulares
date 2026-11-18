import { useState } from 'react';
import { repairsApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import Pill from '../../components/panel/Pill';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../auth/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import { site } from '../../config/site';
import { formatBs } from '../../utils/format';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import { REPAIR_STATES, repairTone } from '../../utils/panelFormat';
import styles from './Panel.module.css';

const phoneFor = (n) => {
  const d = String(n ?? '').replace(/\D/g, '');
  if (!d) return '';
  return d.startsWith('591') ? d : `591${d}`;
};

function readyMessage(r) {
  return `Hola ${r.cliente.split(' ')[0]}, te escribimos de ${site.name}. Tu ${r.modelo ?? 'equipo'} (orden N° ${r.id_reparacion}) ya está listo para recoger.` +
    (Number(r.a_cobrar) > 0 ? ` Total a pagar: ${formatBs(Number(r.a_cobrar))}.` : '') + ' ¡Te esperamos!';
}

function ManageDialog({ id, canEdit, onClose, onSaved }) {
  const { data: r, loading, error, reload } = useAsync(() => repairsApi.get(id), [id]);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const cur = form ?? (r && { estado: r.estado, diagnostico: r.diagnostico ?? '', costo_mano_obra: r.costo_mano_obra ?? 0 });
  const closed = r && ['Entregado', 'Cancelado'].includes(r.estado);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFailure('');
    try {
      await repairsApi.update(id, { estado: cur.estado, diagnostico: cur.diagnostico, costo_mano_obra: Number(cur.costo_mano_obra) });
      setForm(null);
      onSaved();
      reload();
    } catch (err) { setFailure(err.message); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setForm({ ...cur, [k]: e.target.value });
  const phone = r ? phoneFor(r.cliente_telefono) : '';

  return (
    <div className="modal is-active" role="dialog" aria-modal="true">
      <div className="modal-background" onClick={onClose} />
      <div className="modal-card">
        <header className="modal-card-head"><p className="modal-card-title">Reparación N° {id}</p><button type="button" className="delete" aria-label="Cerrar" onClick={onClose} /></header>
        <section className="modal-card-body">
          <AsyncView loading={loading} error={error} onRetry={reload}>
            {r && cur && (
              <>
                <p><strong>{r.cliente}</strong> · {r.modelo ?? 'Equipo'} {r.imei && <span className="has-text-grey">· IMEI {r.imei}</span>}</p>
                <p className="mb-3 has-text-grey">Falla: {r.falla_reportada}. Repuestos: {formatBs(Number(r.costo_repuestos))} · A cobrar: <strong>{formatBs(Number(r.a_cobrar))}</strong></p>
                {canEdit && !closed ? (
                  <form onSubmit={save}>
                    <div className="field"><label className="label" htmlFor="rep-estado">Estado</label>
                      <div className="select is-fullwidth"><select id="rep-estado" value={cur.estado} onChange={set('estado')}>{REPAIR_STATES.map((s) => <option key={s}>{s}</option>)}</select></div></div>
                    <div className="field"><label className="label" htmlFor="rep-diag">Diagnóstico</label>
                      <textarea id="rep-diag" className="textarea" rows="2" value={cur.diagnostico} onChange={set('diagnostico')} /></div>
                    <div className="field"><label className="label" htmlFor="rep-mo">Mano de obra (Bs)</label>
                      <input id="rep-mo" className="input" type="number" min="0" step="0.01" value={cur.costo_mano_obra} onChange={set('costo_mano_obra')} /></div>
                    {failure && <p className="notification is-danger is-light" role="alert">{failure}</p>}
                    <button className="button is-primary is-rounded" disabled={busy}>Guardar cambios</button>
                  </form>
                ) : (
                  <p><Pill tone={repairTone(r.estado)}>{r.estado}</Pill> {r.diagnostico && <span>· {r.diagnostico}</span>}</p>
                )}
                {r.estado === 'Listo' && (
                  <div className="notification is-success is-light mt-4">
                    <p className="mb-2"><strong>El equipo está listo.</strong> Avisa al cliente:</p>
                    {phone ? (
                      <a className="button is-success is-rounded" target="_blank" rel="noopener noreferrer" href={buildWhatsAppLink(phone, readyMessage(r))}>
                        Avisar por WhatsApp
                      </a>
                    ) : <p>Este cliente no tiene teléfono registrado.</p>}
                  </div>
                )}
              </>
            )}
          </AsyncView>
        </section>
      </div>
    </div>
  );
}

export default function RepairsPage() {
  usePageTitle('Reparaciones');
  const { user } = useAuth();
  const [estado, setEstado] = useState('');
  const [openId, setOpenId] = useState(null);
  const { data, loading, error, reload } = useAsync(() => repairsApi.list({ estado }), [estado]);

  return (
    <>
      <PageHeader
        title="Reparaciones"
        subtitle={user.rol === 'Tecnico' ? 'Los equipos que tienes asignados.' : 'Todos los equipos en el taller.'}
      />
      <div className={styles.toolbar}>
        <select className={styles.select} value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado">
          <option value="">Todos los estados</option>
          {REPAIR_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <DataTable
          title="reparaciones"
          rowKey="id_reparacion"
          rows={data ?? []}
          emptyTitle="Sin reparaciones"
          emptyMessage="No hay equipos con ese estado."
          columns={[
            { key: 'id_reparacion', header: 'N°' },
            { key: 'fecha_ingreso', header: 'Ingreso', render: (r) => r.fecha_ingreso.slice(0, 10) },
            { key: 'cliente', header: 'Cliente' },
            { key: 'modelo', header: 'Equipo', render: (r) => r.modelo ?? '—' },
            { key: 'falla_reportada', header: 'Falla' },
            { key: 'tecnico', header: 'Técnico' },
            { key: 'estado', header: 'Estado', render: (r) => <Pill tone={repairTone(r.estado)}>{r.estado}</Pill> },
            { key: 'a_cobrar', header: 'A cobrar', align: 'right', render: (r) => formatBs(Number(r.a_cobrar)) },
            { key: 'gestionar', header: '', render: (r) => <button type="button" className="button is-small is-primary is-outlined is-rounded" onClick={() => setOpenId(r.id_reparacion)}>Gestionar</button> },
          ]}
        />
      </AsyncView>
      {openId && <ManageDialog id={openId} canEdit onClose={() => setOpenId(null)} onSaved={reload} />}
    </>
  );
}
