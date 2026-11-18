import { useState } from 'react';
import { authApi } from '../../api/panel/authApi';

// Ventana (componente `modal` de Bulma) para que cada usuario cambie su propia contraseña.
export default function ChangePasswordDialog({ onClose, onChanged, forced = false }) {
  const [form, setForm] = useState({ actual: '', nueva: '', repetir: '' });
  const [state, setState] = useState({ busy: false, error: '', done: false });
  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.nueva.length < 8) return setState({ busy: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.', done: false });
    if (form.nueva !== form.repetir) return setState({ busy: false, error: 'Las contraseñas nuevas no coinciden.', done: false });
    setState({ busy: true, error: '', done: false });
    try {
      const result = await authApi.changePassword(form.actual, form.nueva);
      setState({ busy: false, error: '', done: true });
      onChanged?.(result);
    } catch (e) {
      setState({ busy: false, error: e.status ? e.message : 'No pudimos conectar con el servidor.', done: false });
    }
  };

  return (
    <div className="modal is-active no-print" role="dialog" aria-modal="true" aria-labelledby="pw-title">
      <div className="modal-background" onClick={forced && !state.done ? undefined : onClose} />
      <form className="modal-card" onSubmit={submit}>
        <header className="modal-card-head">
          <p id="pw-title" className="modal-card-title">Cambiar contraseña</p>
          {!(forced && !state.done) && <button type="button" className="delete" aria-label="Cerrar" onClick={onClose} />}
        </header>
        <section className="modal-card-body">
          {state.done ? (
            <div className="notification is-success is-light">Listo: tu contraseña fue cambiada.</div>
          ) : (
            <>
              {forced && <p className="notification is-warning is-light">Por seguridad, debes cambiar la contraseña inicial antes de usar el sistema.</p>}
              <div className="field">
                <label className="label" htmlFor="pw-actual">Contraseña actual</label>
                <input id="pw-actual" className="input" type="password" autoComplete="current-password" required value={form.actual} onChange={update('actual')} />
              </div>
              <div className="field">
                <label className="label" htmlFor="pw-nueva">Contraseña nueva</label>
                <input id="pw-nueva" className="input" type="password" autoComplete="new-password" required value={form.nueva} onChange={update('nueva')} />
                <p className="help">Mínimo 8 caracteres.</p>
              </div>
              <div className="field">
                <label className="label" htmlFor="pw-repetir">Repite la contraseña nueva</label>
                <input id="pw-repetir" className="input" type="password" autoComplete="new-password" required value={form.repetir} onChange={update('repetir')} />
              </div>
              {state.error && <p className="notification is-danger is-light" role="alert">{state.error}</p>}
            </>
          )}
        </section>
        <footer className="modal-card-foot">
          {state.done ? (
            <button type="button" className="button is-primary is-rounded" onClick={onClose}>Cerrar</button>
          ) : (
            <>
              <button type="submit" className={`button is-primary is-rounded ${state.busy ? 'is-loading' : ''}`} disabled={state.busy}>Guardar</button>
              {!forced && <button type="button" className="button is-rounded" onClick={onClose}>Cancelar</button>}
            </>
          )}
        </footer>
      </form>
    </div>
  );
}
