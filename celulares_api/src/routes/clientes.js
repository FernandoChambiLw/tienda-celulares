import { Router } from 'express';
import { q, tx } from '../db.js';
import { ah, required, pick, notFound, toInt, insertSql, updateSql, pageParams, bad } from '../utils.js';
import { requireRole } from '../auth.js';

const router = Router();
const FIELDS = ['nombres', 'apellido_paterno', 'apellido_materno', 'ci', 'fecha_nacimiento', 'sexo',
                'correo', 'direccion', 'tipo_cliente', 'nit', 'razon_social', 'estado'];
const TEL_TIPOS = ['Celular', 'Fijo', 'WhatsApp'];

const SELECT = `
  SELECT c.*,
         COALESCE((SELECT json_agg(json_build_object('id_telefono', t.id_telefono, 'numero', t.numero, 'tipo', t.tipo) ORDER BY t.id_telefono)
                     FROM telefono_cliente t WHERE t.id_cliente = c.id_cliente), '[]') AS telefonos
    FROM cliente c`;

async function guardarTelefonos(c, idCliente, telefonos) {
  if (!Array.isArray(telefonos)) return;
  await q('DELETE FROM telefono_cliente WHERE id_cliente = $1', [idCliente], c);
  for (const t of telefonos) {
    if (!t.numero) throw bad('Cada teléfono necesita número');
    if (t.tipo && !TEL_TIPOS.includes(t.tipo)) throw bad(`tipo de teléfono: ${TEL_TIPOS.join(', ')}`);
    await q('INSERT INTO telefono_cliente (numero, tipo, id_cliente) VALUES ($1, $2, $3)',
      [String(t.numero).trim(), t.tipo || 'Celular', idCliente], c);
  }
}

// GET /api/clientes?q=texto&estado=Activo&limit=&offset=
router.get('/', ah(async (req, res) => {
  const { limit, offset } = pageParams(req);
  const params = [];
  const where = [];
  if (req.query.q) {
    params.push(`%${req.query.q}%`);
    where.push(`(c.nombres ILIKE $${params.length} OR c.apellido_paterno ILIKE $${params.length}
                 OR COALESCE(c.apellido_materno,'') ILIKE $${params.length} OR c.ci ILIKE $${params.length})`);
  }
  if (req.query.estado) { params.push(req.query.estado); where.push(`c.estado = $${params.length}`); }
  params.push(limit, offset);
  const { rows } = await q(
    `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY c.apellido_paterno, c.nombres LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json(rows);
}));

router.get('/:id', ah(async (req, res) => {
  const { rows } = await q(`${SELECT} WHERE c.id_cliente = $1`, [toInt(req.params.id, 'id')]);
  if (!rows[0]) throw notFound('Cliente no encontrado');
  res.json(rows[0]);
}));

// Historial de compras del cliente
router.get('/:id/ventas', ah(async (req, res) => {
  const { rows } = await q(
    'SELECT id_venta, fecha_hora, estado, total FROM v_venta_total WHERE id_cliente = $1 ORDER BY fecha_hora DESC',
    [toInt(req.params.id, 'id')]);
  res.json(rows);
}));

router.post('/', requireRole('Vendedor', 'Tecnico'), ah(async (req, res) => {
  required(req.body, ['nombres', 'apellido_paterno', 'ci']);
  const out = await tx(async (c) => {
    const sql = insertSql('cliente', pick(req.body, FIELDS));
    const { rows } = await q(sql.text, sql.values, c);
    await guardarTelefonos(c, rows[0].id_cliente, req.body.telefonos);
    return rows[0].id_cliente;
  });
  res.status(201).json((await q(`${SELECT} WHERE c.id_cliente = $1`, [out])).rows[0]);
}));

router.put('/:id', requireRole('Vendedor', 'Tecnico'), ah(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  await tx(async (c) => {
    const data = pick(req.body, FIELDS);
    if (Object.keys(data).length) {
      const sql = updateSql('cliente', 'id_cliente', id, data);
      const r = await q(sql.text, sql.values, c);
      if (!r.rows[0]) throw notFound('Cliente no encontrado');
    } else {
      const r = await q('SELECT 1 FROM cliente WHERE id_cliente = $1', [id], c);
      if (!r.rows[0]) throw notFound('Cliente no encontrado');
    }
    await guardarTelefonos(c, id, req.body.telefonos);
  });
  res.json((await q(`${SELECT} WHERE c.id_cliente = $1`, [id])).rows[0]);
}));

// Un cliente con ventas o reparaciones no se puede borrar (FK RESTRICT -> 409)
router.delete('/:id', requireRole(), ah(async (req, res) => {
  const r = await q('DELETE FROM cliente WHERE id_cliente = $1 RETURNING id_cliente', [toInt(req.params.id, 'id')]);
  if (!r.rows[0]) throw notFound('Cliente no encontrado');
  res.status(204).end();
}));

export default router;
