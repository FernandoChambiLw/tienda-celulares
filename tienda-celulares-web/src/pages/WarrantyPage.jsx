import { useState } from 'react';
import { warrantyApi } from '../api/repairStatusApi';
import PageHeader from '../components/ui/PageHeader';
import { usePageTitle } from '../hooks/usePageTitle';

const day = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

export default function WarrantyPage() {
  usePageTitle('Consultar garantía');
  const [imei, setImei] = useState('');
  const [state, setState] = useState({ busy: false, error: '', result: null });

  const submit = async (event) => {
    event.preventDefault();
    setState({ busy: true, error: '', result: null });
    try {
      setState({ busy: false, error: '', result: await warrantyApi.find(imei.trim()) });
    } catch (e) {
      setState({ busy: false, error: e.status ? e.message : 'No pudimos conectar con el servidor.', result: null });
    }
  };
  const { result } = state;
  const vigente = result?.estado === 'Vigente';

  return (
    <div className="container">
      <PageHeader title="Consultar garantía" subtitle="Escribe el IMEI de tu celular (marca *#06# en el teléfono, o míralo en la caja o la factura)." />
      <div className="columns">
        <div className="column is-5">
          <form className="box" onSubmit={submit}>
            <div className="field">
              <label className="label" htmlFor="gar-imei">IMEI</label>
              <input id="gar-imei" className="input" inputMode="numeric" required value={imei} onChange={(e) => setImei(e.target.value)} placeholder="15 dígitos" autoComplete="off" />
              <p className="help">Solo mostramos el modelo y la vigencia; nunca datos personales.</p>
            </div>
            <button type="submit" className={`button is-primary is-rounded is-fullwidth ${state.busy ? 'is-loading' : ''}`} disabled={state.busy}>Consultar</button>
          </form>
          {state.error && <p className="notification is-danger is-light" role="alert">{state.error}</p>}
        </div>
        <div className="column is-7">
          {result && (
            <div className="box" aria-live="polite">
              <p className="title is-4">{result.modelo}</p>
              <span className={`tag is-medium ${vigente ? 'is-success' : 'is-danger'}`}>{vigente ? 'Garantía vigente' : `Garantía ${String(result.estado).toLowerCase()}`}</span>
              <p className="mt-3">Cubre {result.meses} {result.meses === 1 ? 'mes' : 'meses'}: del {day(result.fecha_inicio)} al <strong>{day(result.fecha_fin)}</strong>.</p>
              {vigente && <p className="has-text-grey">Te quedan {result.dias_restantes} días.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
