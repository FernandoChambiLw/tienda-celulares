import jwt from 'jsonwebtoken';
import { HttpError } from './utils.js';

export function signToken(user) {
  return jwt.sign(
    { id_usuario: user.id_usuario, id_empleado: user.id_empleado, rol: user.rol, id_sucursal: user.id_sucursal },
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
