import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/panel/authApi';
import { setUnauthorizedHandler } from '../api/httpClient';
import { session } from '../api/session';

const AuthContext = createContext(null);

// status: 'loading' (verificando token guardado) | 'in' | 'out'
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(session.token() ? 'loading' : 'out');

  const logout = useCallback(() => {
    session.clear();
    setUser(null);
    setStatus('out');
  }, []);

  // Si la API responde 401 en cualquier petición, se cierra la sesión.
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // Al abrir la página con un token guardado, se confirma que sigue siendo válido.
  useEffect(() => {
    if (status !== 'loading') return;
    authApi
      .me()
      .then((me) => {
        setUser(me);
        setStatus('in');
      })
      .catch(logout);
  }, [status, logout]);

  const login = useCallback(async (username, password) => {
    const { token, usuario } = await authApi.login(username, password);
    session.save({ token });
    setUser(usuario);
    setStatus('in');
  }, []);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
