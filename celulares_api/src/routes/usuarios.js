import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { q } from '../db.js';
import { ah, required, pick, bad, notFound, toInt, updateSql } from '../utils.js';
import { requireRole } from '../auth.js';
import { audit } from '../bitacora.js';

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

const EMP = ['nombres', 'apellido_paterno', 'apellido_materno', 'ci', 'telefono', 'correo', 'direccion', 'salario', 'id_cargo', 'id_sucursal', 'estado', 'fecha_nacimiento'];
const EMP_SEL = `SELECT e.*, c.nombre_cargo, (u.id_usuario IS NOT NULL) AS tiene_usuario, u.username, u.id_usuario, u.rol, u.estado AS estado_usuario
                   FROM empleado e JOIN cargo c USING (id_cargo) LEFT JOIN usuario u USING (id_empleado)`;

// Empleados (la persona); el usuario es su acceso al sistema.
router.get('/empleados', ah(async (_req, res) => res.json((await q(`${EMP_SEL} ORDER BY e.estado, e.apellido_paterno, e.nombres`)).rows)));
router.get('/cargos', ah(async (_req, res) => res.json((await q('SELECT id_cargo, nombre_cargo FROM cargo ORDER BY id_cargo')).rows)));

router.post('/empleados', ah(async (req, res) => {
  required(req.body, ['nombres', 'apellido_paterno', 'ci', 'id_cargo']);
  const data = pick(req.body, EMP);
  data.salario = data.salario === undefined || data.salario === '' ? 0 : data.salario;
  if (!data.id_sucursal) data.id_sucursal = (await q('SELECT id_sucursal FROM sucursal ORDER BY id_sucursal LIMIT 1')).rows[0].id_sucursal;
  for (const k of ['correo', 'telefono', 'direccion', 'apellido_materno', 'fecha_nacimiento']) if (data[k] === '') data[k] = null;
  const cols = Object.keys(data);
  const { rows } = await q(
    `INSERT INTO empleado (${cols.join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) RETURNING id_empleado`, cols.map((k) => data[k]));
  await audit(req, 'Alta de empleado', 'empleado', rows[0].id_empleado, `${data.nombres} ${data.apellido_paterno}`);
  res.status(201).json((await q(`${EMP_SEL} WHERE e.id_empleado = $1`, [rows[0].id_empleado])).rows[0]);
}));

router.put('/empleados/:id', ah(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const data = pick(req.body, EMP);
  for (const k of ['correo', 'telefono', 'direccion', 'apellido_materno', 'fecha_nacimiento']) if (data[k] === '') data[k] = null;
  if (data.estado && data.estado !== 'Activo' && id === req.user.id_empleado) throw bad('No puedes desactivarte a ti mismo');
  if (!Object.keys(data).length) throw bad('Nada que actualizar');
  const sql = updateSql('empleado', 'id_empleado', id, data);
  const r = await q(sql.text, sql.values);
  if (!r.rows[0]) throw notFound('Empleado no encontrado');
  await audit(req, 'Edición de empleado', 'empleado', id, Object.keys(data).join(', '));
  res.json((await q(`${EMP_SEL} WHERE e.id_empleado = $1`, [id])).rows[0]);
}));

router.post('/', ah(async (req, res) => {
  required(req.body, ['username', 'password', 'rol', 'id_empleado']);
  const { username, password, rol } = req.body;
  if (!ROLES.includes(rol)) throw bad(`rol debe ser: ${ROLES.join(', ')}`);
  if (String(password).length < 8) throw bad('La clave debe tener al menos 8 caracteres');
  const hash = await bcrypt.hash(String(password), 10);
  const { rows } = await q(
    `INSERT INTO usuario (username, password_hash, rol, id_empleado, debe_cambiar_clave) VALUES ($1,$2,$3,$4,TRUE) RETURNING id_usuario`,
    [String(username).trim(), hash, rol, toInt(req.body.id_empleado, 'id_empleado')],
  );
  await audit(req, 'Alta de usuario', 'usuario', rows[0].id_usuario, `${String(username).trim()} (${rol})`);
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
    data.debe_cambiar_clave = true; // una clave puesta por el administrador es temporal
  }
  if (id === req.user.id_usuario && (data.estado && data.estado !== 'Activo'))
    throw bad('No puedes desactivar tu propio usuario');
  const sql = updateSql('usuario', 'id_usuario', id, data);
  const r = await q(sql.text, sql.values);
  if (!r.rows[0]) throw notFound('Usuario no encontrado');
  const out = await q(`SELECT ${SAFE} FROM usuario u JOIN empleado e USING (id_empleado) WHERE u.id_usuario = $1`, [id]);
  await audit(req, 'Edición de usuario', 'usuario', id, Object.keys(data).filter((k) => k !== 'password_hash').join(', ') + (data.password_hash ? ' (clave restablecida)' : ''));
  res.json(out.rows[0]);
}));

export default router;
