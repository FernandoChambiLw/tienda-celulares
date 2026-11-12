import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { q, tx } from '../db.js';
import { ah, required, pick, notFound, toInt, bad, insertSql, updateSql, pageParams } from '../utils.js';
import { requireRole } from '../auth.js';
import { UPLOADS_DIR } from '../config.js';

const router = Router();

const PRODUCTO = ['codigo', 'nombre', 'descripcion', 'precio_compra', 'precio_venta', 'garantia_meses',
                  'foto_url', 'estado', 'id_marca', 'id_categoria'];
const TIPOS = {
  Celular: { tabla: 'celular', campos: ['modelo', 'ram_gb', 'almacenamiento_gb', 'sistema_operativo', 'version_so',
    'tamanio_pantalla', 'resolucion', 'camara_principal_mp', 'camara_frontal_mp', 'bateria_mah', 'procesador',
    'color', 'red', 'dual_sim'] },
  Accesorio: { tabla: 'accesorio', campos: ['tipo_accesorio', 'compatibilidad', 'material', 'color',
    'peso_gramos', 'conectividad', 'potencia_w'] },
  Dispositivo: { tabla: 'dispositivo_complementario', campos: ['tipo_dispositivo', 'modelo', 'conectividad',
    'autonomia_horas', 'resistencia_agua', 'color', 'peso_gramos'] },
};
const VE_COSTO = ['Administrador', 'Almacenero'];

const quitarCosto = (user, rows) => {
  if (VE_COSTO.includes(user.rol)) return rows;
  return rows.map(({ precio_compra, ...r }) => r);
};

const LISTA = `
  SELECT p.id_producto, p.codigo, p.nombre, p.tipo_producto, p.precio_compra, p.precio_venta,
         p.garantia_meses, p.foto_url, p.estado, p.id_marca, m.nombre AS marca,
         p.id_categoria, c.nombre AS categoria, s.stock_total, s.requiere_reposicion
    FROM producto p
    JOIN marca m USING (id_marca)
    JOIN categoria c USING (id_categoria)
    JOIN v_stock_producto s USING (id_producto)`;

// GET /api/productos?q=&tipo=&id_categoria=&id_marca=&estado=
router.get('/', ah(async (req, res) => {
  const { limit, offset } = pageParams(req);
  const params = [];
  const where = [];
  // add(plantilla, valor): {P} se reemplaza por el número de parámetro (puede repetirse)
  const add = (sql, v) => { params.push(v); where.push(sql.replaceAll('{P}', `$${params.length}`)); };
  if (req.query.q) add('(p.nombre ILIKE {P} OR p.codigo ILIKE {P})', `%${req.query.q}%`);
  if (req.query.tipo) add('p.tipo_producto = {P}', req.query.tipo);
  if (req.query.id_categoria) add('p.id_categoria = {P}', toInt(req.query.id_categoria, 'id_categoria'));
  if (req.query.id_marca) add('p.id_marca = {P}', toInt(req.query.id_marca, 'id_marca'));
  add('p.estado = {P}', req.query.estado || 'Activo');
  params.push(limit, offset);
  const { rows } = await q(
    `${LISTA} WHERE ${where.join(' AND ')} ORDER BY p.nombre LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json(quitarCosto(req.user, rows));
}));

router.get('/:id', ah(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const { rows } = await q(`${LISTA} WHERE p.id_producto = $1`, [id]);
  if (!rows[0]) throw notFound('Producto no encontrado');
  const prod = rows[0];
  const esp = await q(`SELECT * FROM ${TIPOS[prod.tipo_producto].tabla} WHERE id_producto = $1`, [id]);
  const inv = await q(
    `SELECT i.id_almacen, a.nombre AS almacen, i.stock_actual, i.stock_minimo, i.stock_maximo, i.ubicacion_estante
       FROM inventario i JOIN almacen a USING (id_almacen) WHERE i.id_producto = $1 ORDER BY i.id_almacen`, [id]);
  const promo = await q(
    `SELECT id_promocion, nombre, porcentaje_descuento, fecha_fin FROM promocion
      WHERE id_producto = $1 AND estado = 'Vigente' AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin`, [id]);
  const [out] = quitarCosto(req.user, [prod]);
  res.json({ ...out, detalle: esp.rows[0] || null, inventario: inv.rows, promociones: promo.rows });
}));

// POST /api/productos   { codigo, nombre, tipo_producto, precio_*, id_marca, id_categoria, detalle:{...} }
router.post('/', requireRole('Almacenero'), ah(async (req, res) => {
  required(req.body, ['codigo', 'nombre', 'tipo_producto', 'precio_compra', 'precio_venta', 'id_marca', 'id_categoria']);
  const tipo = TIPOS[req.body.tipo_producto];
  if (!tipo) throw bad(`tipo_producto debe ser: ${Object.keys(TIPOS).join(', ')}`);
  const det = pick(req.body.detalle, tipo.campos);
  if (req.body.tipo_producto === 'Celular') required(det, ['modelo']);
  if (req.body.tipo_producto === 'Accesorio') required(det, ['tipo_accesorio']);
  if (req.body.tipo_producto === 'Dispositivo') required(det, ['tipo_dispositivo']);

  const id = await tx(async (c) => {
    const sql = insertSql('producto', { ...pick(req.body, PRODUCTO), tipo_producto: req.body.tipo_producto });
    const { rows } = await q(sql.text, sql.values, c);
    const esp = insertSql(tipo.tabla, { id_producto: rows[0].id_producto, ...det });
    await q(esp.text, esp.values, c);
    return rows[0].id_producto;
  });
  const { rows } = await q(`${LISTA} WHERE p.id_producto = $1`, [id]);
  res.status(201).json(rows[0]);
}));

router.put('/:id', requireRole('Almacenero'), ah(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  await tx(async (c) => {
    const cur = await q('SELECT tipo_producto FROM producto WHERE id_producto = $1', [id], c);
    if (!cur.rows[0]) throw notFound('Producto no encontrado');
    const tipo = TIPOS[cur.rows[0].tipo_producto];
    const data = pick(req.body, PRODUCTO);
    if (Object.keys(data).length) { const s = updateSql('producto', 'id_producto', id, data); await q(s.text, s.values, c); }
    const det = pick(req.body.detalle, tipo.campos);
    if (Object.keys(det).length) { const s = updateSql(tipo.tabla, 'id_producto', id, det); await q(s.text, s.values, c); }
  });
  const { rows } = await q(`${LISTA} WHERE p.id_producto = $1`, [id]);
  res.json(rows[0]);
}));

// Si ya tiene movimientos/ventas la FK lo impide (409); en ese caso use estado = 'Descontinuado'.
router.delete('/:id', requireRole(), ah(async (req, res) => {
  const r = await q('DELETE FROM producto WHERE id_producto = $1 RETURNING 1', [toInt(req.params.id, 'id')]);
  if (!r.rows[0]) throw notFound('Producto no encontrado');
  res.status(204).end();
}));

// ---------- Foto ----------
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(bad('Solo se aceptan imágenes JPG, PNG o WEBP')),
});

// POST /api/productos/:id/foto  (multipart, campo "foto")
router.post('/:id/foto', requireRole('Almacenero'), upload.single('foto'), ah(async (req, res) => {
  if (!req.file) throw bad('Envía la imagen en el campo "foto"');
  const id = toInt(req.params.id, 'id');
  const old = await q('SELECT foto_url FROM producto WHERE id_producto = $1', [id]);
  if (!old.rows[0]) { fs.unlink(req.file.path, () => {}); throw notFound('Producto no encontrado'); }
  const url = `/uploads/${req.file.filename}`;
  await q('UPDATE producto SET foto_url = $1 WHERE id_producto = $2', [url, id]);
  if (old.rows[0].foto_url?.startsWith('/uploads/'))
    fs.unlink(`${UPLOADS_DIR}/${old.rows[0].foto_url.slice(9)}`, () => {});
  res.json({ foto_url: url });
}));

export default router;
