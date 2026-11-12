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
      <form className={styles.card} onSubmit={submit}>
        <h1 className={styles.title}>{site.name}</h1>
        <p className={styles.subtitle}>Panel interno para el personal</p>

        {env.useMock && (
          <p className={styles.notice}>
            La web está en modo de datos de ejemplo. Para entrar al panel pon
            <code> VITE_USE_MOCK=false </code> en <code>.env</code> y enciende la API.
          </p>
        )}

        <label className={styles.field}>
          Usuario
          <input value={form.username} onChange={update('username')} autoComplete="username" required autoFocus />
        </label>
        <label className={styles.field}>
          Contraseña
          <input type="password" value={form.password} onChange={update('password')} autoComplete="current-password" required />
        </label>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <button type="submit" className="btn btn--primary" disabled={busy || env.useMock}>
          {busy ? 'Ingresando…' : 'Ingresar'}
        </button>
        <Link to="/" className={styles.back}>← Volver a la tienda</Link>
      </form>
    </div>
  );
}
