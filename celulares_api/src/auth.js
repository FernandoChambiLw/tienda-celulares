import jwt from 'jsonwebtoken';
import { HttpError } from './utils.js';
import { q } from './db.js';

export function signToken(user) {
  return jwt.sign(
    { id_usuario: user.id_usuario, username: user.username, id_empleado: user.id_empleado, rol: user.rol, id_sucursal: user.id_sucursal, cambiar: user.debe_cambiar_clave === true ? 1 : undefined },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '8h' },
  );
}

/** Exige un token válido y deja el usuario en req.user. */
export function auth(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Falta el token de acceso'));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    // Con la clave inicial pendiente de cambio solo se permite entrar a /auth (cambiar la clave).
    if (req.user.cambiar && !req.baseUrl.endsWith('/auth')) return next(new HttpError(403, 'Debes cambiar tu contraseña antes de continuar'));
    next();
  } catch {
    next(new HttpError(401, 'Token inválido o vencido'));
  }
}

/** El Administrador siempre pasa; el resto debe estar en la lista. */
export const requireRole = (...roles) => (req, _res, next) => {
  if (req.user.rol === 'Administrador' || roles.includes(req.user.rol)) return next();
  next(new HttpError(403, 'No tienes permiso para esta operación'));
};

/**
 * Confirma en la base que el usuario sigue activo y toma el rol vigente: si un administrador
 * desactiva a alguien o le cambia el rol, el efecto es inmediato (no al vencer su token).
 */
export async function vigente(req, _res, next) {
  try {
    const r = (await q(
      `SELECT u.rol, u.estado, e.estado AS estado_empleado FROM usuario u JOIN empleado e USING (id_empleado) WHERE u.id_usuario = $1`,
      [req.user.id_usuario])).rows[0];
    if (!r || r.estado !== 'Activo' || r.estado_empleado !== 'Activo') return next(new HttpError(401, 'Tu usuario fue desactivado'));
    req.user.rol = r.rol;
    next();
  } catch (e) { next(e); }
}
