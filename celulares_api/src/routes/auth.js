import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { q } from '../db.js';
import { ah, required, HttpError } from '../utils.js';
import { auth, signToken } from '../auth.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, espera unos minutos' },
});

// POST /api/auth/login  { username, password }
router.post('/login', limiter, ah(async (req, res) => {
  required(req.body, ['username', 'password']);
  const { username, password } = req.body;

  const { rows } = await q(
    `SELECT u.id_usuario, u.username, u.password_hash, u.rol, u.estado, u.id_empleado,
            e.nombres, e.apellido_paterno, e.id_sucursal, e.estado AS estado_empleado
       FROM usuario u JOIN empleado e ON e.id_empleado = u.id_empleado
      WHERE u.username = $1`,
    [String(username).trim()],
  );
  const u = rows[0];
  // Mismo mensaje si no existe o la clave es incorrecta (no revela usuarios válidos)
  const ok = u && (await bcrypt.compare(String(password), u.password_hash));
  if (!ok) throw new HttpError(401, 'Usuario o contraseña incorrectos');
  if (u.estado !== 'Activo' || u.estado_empleado !== 'Activo')
    throw new HttpError(403, 'Usuario inactivo o bloqueado');

  await q('UPDATE usuario SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id_usuario = $1', [u.id_usuario]);
  res.json({
    token: signToken(u),
    usuario: {
      id_usuario: u.id_usuario, username: u.username, rol: u.rol,
      id_empleado: u.id_empleado, id_sucursal: u.id_sucursal,
      nombre: `${u.nombres} ${u.apellido_paterno}`,
    },
  });
}));

// GET /api/auth/me
router.get('/me', auth, ah(async (req, res) => {
  const { rows } = await q(
    `SELECT u.id_usuario, u.username, u.rol, e.id_empleado, e.id_sucursal,
            e.nombres || ' ' || e.apellido_paterno AS nombre
       FROM usuario u JOIN empleado e ON e.id_empleado = u.id_empleado
      WHERE u.id_usuario = $1`,
    [req.user.id_usuario],
  );
  if (!rows[0]) throw new HttpError(401, 'Usuario no encontrado');
  res.json(rows[0]);
}));

// POST /api/auth/cambiar-clave  { actual, nueva }
router.post('/cambiar-clave', auth, ah(async (req, res) => {
  required(req.body, ['actual', 'nueva']);
  if (String(req.body.nueva).length < 8) throw new HttpError(400, 'La nueva clave debe tener al menos 8 caracteres');
  const { rows } = await q('SELECT password_hash FROM usuario WHERE id_usuario = $1', [req.user.id_usuario]);
  if (!rows[0] || !(await bcrypt.compare(String(req.body.actual), rows[0].password_hash)))
    throw new HttpError(401, 'La clave actual es incorrecta');
  await q('UPDATE usuario SET password_hash = $1 WHERE id_usuario = $2',
    [await bcrypt.hash(String(req.body.nueva), 10), req.user.id_usuario]);
  res.json({ ok: true });
}));

export default router;
