import { useState } from 'react';
import { warrantyAdminApi } from '../../api/panel/panelApi';
import Pill from '../../components/panel/Pill';
import PageHeader from '../../components/ui/PageHeader';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/format';

export default function WarrantyAdminPage() {
  usePageTitle('Garantías');
  const [imei, setImei] = useState('');
  const [state, setState] = useState({ busy: false, error: '', data: null });

  const search = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '', data: null });
    try { setState({ busy: false, error: '', data: await warrantyAdminApi.byImei(imei.trim()) }); } catch (err) { setState({ busy: false, error: err.message, data: null }); }
  };
  const d = state.data;

  return (
    <>
      <PageHeader title="Garantía por IMEI" subtitle="Quién compró el equipo, cuándo, si la garantía sigue vigente y qué reparaciones tuvo." />
      <form className="field has-addons" onSubmit={search}>
        <div className="control is-expanded"><input className="input" inputMode="numeric" required placeholder="IMEI del equipo" value={imei} onChange={(e) => setImei(e.target.value)} aria-label="IMEI" /></div>
        <div className="control"><button className={`button is-primary ${state.busy ? 'is-loading' : ''}`}>Buscar</button></div>
      </form>
      {state.error && <p className="notification is-danger is-light" role="alert">{state.error}</p>}
      {d && (
        <div className="box">
          <p className="title is-5">{d.modelo} <span className="has-text-grey is-size-6">IMEI {d.imei}</span></p>
          {d.cliente ? (
            <p>Vendido a <strong>{d.cliente}</strong> (CI {d.cliente_ci}{d.cliente_telefono && ` · ${d.cliente_telefono}`}) el {formatDate(d.fecha_venta)} · venta N° {d.id_venta}</p>
          ) : <p className="has-text-grey">Este equipo no figura vendido (estado: {d.estado_unidad}).</p>}
          <h3 className="title is-6 mt-4">Garantías</h3>
          {d.garantias.length ? d.garantias.map((g) => (
            <p key={g.id_garantia}><Pill tone={g.estado === 'Vigente' ? 'ok' : 'danger'}>{g.estado}</Pill> {g.meses} meses · {formatDate(g.fecha_inicio)} → {formatDate(g.fecha_fin)}{g.estado === 'Vigente' && ` · quedan ${g.dias_restantes} días`}</p>
          )) : <p className="has-text-grey">Sin garantía registrada.</p>}
          <h3 className="title is-6 mt-4">Reparaciones</h3>
          {d.reparaciones.length ? d.reparaciones.map((r) => <p key={r.id_reparacion}>N° {r.id_reparacion} · {formatDate(r.fecha_ingreso)} · <Pill>{r.estado}</Pill> {r.falla_reportada}</p>) : <p className="has-text-grey">Sin reparaciones.</p>}
        </div>
      )}
    </>
  );
}
