import { useState } from 'react';
import { repairStatusApi } from '../api/repairStatusApi';
import PageHeader from '../components/ui/PageHeader';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatBs } from '../utils/format';
import { repairTone } from '../utils/panelFormat';

// Etapas normales de una reparación, en orden. «Cancelado» se muestra aparte.
const STEPS = ['Recibido', 'Diagnostico', 'En reparacion', 'Listo', 'Entregado'];
const LABELS = { Recibido: 'Recibido', Diagnostico: 'En diagnóstico', 'En reparacion': 'En reparación', Listo: 'Listo para recoger', Entregado: 'Entregado', Cancelado: 'Cancelado' };
const TAG = { ok: 'is-success', warn: 'is-warning', danger: 'is-danger', neutral: 'is-info' };

const day = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

export default function RepairStatusPage() {
  usePageTitle('Estado de mi reparación');
  const [form, setForm] = useState({ codigo: '', ci: '' });
  const [state, setState] = useState({ busy: false, error: '', result: null });
  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setState({ busy: true, error: '', result: null });
    try {
      const result = await repairStatusApi.find({ codigo: form.codigo.trim(), ci: form.ci.trim() });
      setState({ busy: false, error: '', result });
    } catch (e) {
      setState({ busy: false, error: e.status ? e.message : 'No pudimos conectar con el servidor.', result: null });
    }
  };

  const { result } = state;
  const stepIndex = result ? STEPS.indexOf(result.estado) : -1;

  return (
    <div className="container">
      <PageHeader
        title="Estado de mi reparación"
        subtitle="Escribe el número de orden que te dimos al dejar tu equipo y tu carnet de identidad."
      />

      <div className="columns">
        <div className="column is-5">
          <form className="box" onSubmit={submit}>
            <div className="field">
              <label className="label" htmlFor="rep-codigo">N° de orden</label>
              <div className="control">
                <input id="rep-codigo" className="input" inputMode="numeric" required value={form.codigo} onChange={update('codigo')} placeholder="Ej: 12" />
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="rep-ci">Carnet de identidad</label>
              <div className="control">
                <input id="rep-ci" className="input" required value={form.ci} onChange={update('ci')} placeholder="Ej: 9123456" autoComplete="off" />
              </div>
              <p className="help">Solo se muestra la reparación si ambos datos coinciden.</p>
            </div>
            <button type="submit" className={`button is-primary is-rounded is-fullwidth ${state.busy ? 'is-loading' : ''}`} disabled={state.busy}>
              Consultar
            </button>
          </form>
        </div>

        <div className="column is-7" aria-live="polite">
          {state.error && <div className="notification is-danger is-light" role="alert">{state.error}</div>}

          {result && (
            <div className="box">
              <div className="is-flex is-justify-content-space-between is-align-items-center mb-3">
                <h2 className="title is-5 mb-0">Orden N° {result.id_reparacion}</h2>
                <span className={`tag is-medium is-rounded ${TAG[repairTone(result.estado)]}`}>{LABELS[result.estado] ?? result.estado}</span>
              </div>

              {stepIndex >= 0 && (
                <>
                  <progress className="progress is-primary" value={stepIndex + 1} max={STEPS.length} aria-label="Avance de la reparación">
                    {stepIndex + 1} de {STEPS.length}
                  </progress>
                  <ol className="is-flex is-flex-wrap-wrap mb-4" style={{ gap: '6px 14px', listStyle: 'none' }}>
                    {STEPS.map((step, i) => (
                      <li key={step} className={i <= stepIndex ? 'has-text-weight-bold' : 'has-text-grey-light'}>
                        {i <= stepIndex ? '✓ ' : ''}{LABELS[step]}
                      </li>
                    ))}
                  </ol>
                </>
              )}

              <table className="table is-fullwidth">
                <tbody>
                  <tr><th scope="row">Equipo</th><td>{result.modelo ?? '—'}</td></tr>
                  <tr><th scope="row">Falla reportada</th><td>{result.falla_reportada}</td></tr>
                  {result.diagnostico && <tr><th scope="row">Diagnóstico</th><td>{result.diagnostico}</td></tr>}
                  <tr><th scope="row">Ingreso</th><td>{day(result.fecha_ingreso)}</td></tr>
                  <tr><th scope="row">Entrega estimada</th><td>{day(result.fecha_entrega_estimada)}</td></tr>
                  {result.fecha_entrega_real && <tr><th scope="row">Entregado el</th><td>{day(result.fecha_entrega_real)}</td></tr>}
                  <tr><th scope="row">Costo a cobrar</th><td>{formatBs(Number(result.a_cobrar))}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
