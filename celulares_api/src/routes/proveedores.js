import { Router } from 'express';
import { q } from '../db.js';
import { ah, required, pick, notFound, toInt, insertSql, updateSql } from '../utils.js';
import { requireRole } from '../auth.js';

const router = Router();
const FIELDS = ['razon_social', 'nit', 'nombre_contacto', 'telefono', 'correo', 'direccion',
                'id_ciudad', 'tipo_proveedor', 'estado'];
const SELECT = `SELECT p.*, c.nombre AS ciudad FROM proveedor p LEFT JOIN ciudad c USING (id_ciudad)`;

router.get('/', requireRole('Almacenero'), ah(async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.q) { params.push(`%${req.query.q}%`); where = 'WHERE p.razon_social ILIKE $1 OR p.nit ILIKE $1'; }
  res.json((await q(`${SELECT} ${where} ORDER BY p.razon_social`, params)).rows);
}));

router.get('/:id', requireRole('Almacenero'), ah(async (req, res) => {
  const { rows } = await q(`${SELECT} WHERE p.id_proveedor = $1`, [toInt(req.params.id, 'id')]);
  if (!rows[0]) throw notFound('Proveedor no encontrado');
  res.json(rows[0]);
}));

router.post('/', requireRole('Almacenero'), ah(async (req, res) => {
  required(req.body, ['razon_social', 'nit']);
  const sql = insertSql('proveedor', pick(req.body, FIELDS));
  res.status(201).json((await q(sql.text, sql.values)).rows[0]);
}));

router.put('/:id', requireRole('Almacenero'), ah(async (req, res) => {
  const sql = updateSql('proveedor', 'id_proveedor', toInt(req.params.id, 'id'), pick(req.body, FIELDS));
  const r = await q(sql.text, sql.values);
  if (!r.rows[0]) throw notFound('Proveedor no encontrado');
  res.json(r.rows[0]);
}));

router.delete('/:id', requireRole(), ah(async (req, res) => {
  const r = await q('DELETE FROM proveedor WHERE id_proveedor = $1 RETURNING 1', [toInt(req.params.id, 'id')]);
  if (!r.rows[0]) throw notFound('Proveedor no encontrado');
  res.status(204).end();
}));

export default router;
