import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { q } from '../db.js';
import { ah, required, pick, bad, notFound, toInt, updateSql } from '../utils.js';
import { requireRole } from '../auth.js';

const router = Router();
router.use(requireRole()); // solo Administrador

const ROLES = ['Administrador', 'Vendedor', 'Tecnico', 'Almacenero'];
const ESTADOS = ['Activo', 'Inactivo', 'Bloqueado'];
const SAFE = `u.id_usuario, u.username, u.rol, u.estado, u.ultimo_acceso, u.id_empleado,
              e.nombres || ' ' || e.apellido_paterno AS empleado`;

router.get('/', ah(async (_req, res) => {
  const { rows } = await q(`SELECT ${SAFE} FROM usuario u JOIN empleado e USING (id_empleado) ORDER BY u.username`);
  res.json(rows);
}));

router.post('/', ah(async (req, res) => {
  required(req.body, ['username', 'password', 'rol', 'id_empleado']);
  const { username, password, rol } = req.body;
  if (!ROLES.includes(rol)) throw bad(`rol debe ser: ${ROLES.join(', ')}`);
  if (String(password).length < 8) throw bad('La clave debe tener al menos 8 caracteres');
  const hash = await bcrypt.hash(String(password), 10);
  const { rows } = await q(
    `INSERT INTO usuario (username, password_hash, rol, id_empleado) VALUES ($1,$2,$3,$4) RETURNING id_usuario`,
    [String(username).trim(), hash, rol, toInt(req.body.id_empleado, 'id_empleado')],
  );
  const out = await q(`SELECT ${SAFE} FROM usuario u JOIN empleado e USING (id_empleado) WHERE u.id_usuario = $1`, [rows[0].id_usuario]);
  res.status(201).json(out.rows[0]);
}));

// PATCH /api/usuarios/:id  { rol?, estado?, password? }
router.patch('/:id', ah(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const data = pick(req.body, ['rol', 'estado']);
  if (data.rol && !ROLES.includes(data.rol)) throw bad('rol inválido');
  if (data.estado && !ESTADOS.includes(data.estado)) throw bad('estado inválido');
  if (req.body.password !== undefined) {
    if (String(req.body.password).length < 8) throw bad('La clave debe tener al menos 8 caracteres');
    data.password_hash = await bcrypt.hash(String(req.body.password), 10);
  }
  if (id === req.user.id_usuario && (data.estado && data.estado !== 'Activo'))
    throw bad('No puedes desactivar tu propio usuario');
  const sql = updateSql('usuario', 'id_usuario', id, data);
  const r = await q(sql.text, sql.values);
  if (!r.rows[0]) throw notFound('Usuario no encontrado');
  const out = await q(`SELECT ${SAFE} FROM usuario u JOIN empleado e USING (id_empleado) WHERE u.id_usuario = $1`, [id]);
  res.json(out.rows[0]);
}));

export default router;
