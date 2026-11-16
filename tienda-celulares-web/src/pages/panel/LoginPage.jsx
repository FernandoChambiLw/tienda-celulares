import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { env } from '../../config/env';
import { site } from '../../config/site';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  usePageTitle('Ingresar al panel');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/panel" replace />;

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.username.trim(), form.password);
      navigate(location.state?.from ?? '/panel', { replace: true });
    } catch (e) {
      setError(e.status ? e.message : 'No pudimos conectar con el servidor.');
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={`box ${styles.card}`} onSubmit={submit}>
        <img src="/logo-192.png" alt="" width="64" height="64" className={styles.logo} />
        <h1 className="title is-4 has-text-centered mb-1">{site.name}</h1>
        <p className="subtitle is-6 has-text-centered mb-5">Panel interno para el personal</p>

        {env.useMock && (
          <p className="notification is-warning is-light">
            La web está en modo de datos de ejemplo. Para entrar al panel pon
            <code> VITE_USE_MOCK=false </code> en <code>.env</code> y enciende la API.
          </p>
        )}

        <div className="field">
          <label className="label" htmlFor="login-user">Usuario</label>
          <div className="control">
            <input id="login-user" className="input" value={form.username} onChange={update('username')} autoComplete="username" required autoFocus />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="login-pass">Contraseña</label>
          <div className="control">
            <input id="login-pass" className="input" type="password" value={form.password} onChange={update('password')} autoComplete="current-password" required />
          </div>
        </div>

        {error && <p className="notification is-danger is-light" role="alert">{error}</p>}

        <button type="submit" className={`button is-primary is-rounded is-fullwidth ${busy ? 'is-loading' : ''}`} disabled={busy || env.useMock}>
          {busy ? 'Ingresando…' : 'Ingresar'}
        </button>
        <Link to="/" className={styles.back}>← Volver a la tienda</Link>
      </form>
    </div>
  );
}
