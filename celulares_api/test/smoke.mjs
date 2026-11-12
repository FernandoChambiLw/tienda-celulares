// Prueba de humo: arranca la API contra una BD con los 3 scripts cargados.
// Uso:  DATABASE_URL=postgres://... JWT_SECRET=... node test/smoke.mjs
import assert from 'node:assert/strict';

process.env.JWT_SECRET ||= 'prueba-secreto-de-al-menos-24-caracteres';
const { default: app } = await import('../src/app.js');
const { pool } = await import('../src/db.js');

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
let ok = 0;

async function api(method, path, { token, body } = {}) {
  const r = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, body: json };
}
const check = (name, cond, extra) => {
  try { assert.ok(cond); ok++; console.log('  ok  ', name); }
  catch { console.log('  FALLA', name, extra !== undefined ? JSON.stringify(extra) : ''); process.exitCode = 1; }
};
const login = async (u, p) => (await api('POST', '/api/auth/login', { body: { username: u, password: p } }));

console.log('Autenticación');
check('login incorrecto → 401', (await login('admin', 'mala')).status === 401);
const admin = (await login('admin', 'Admin123!')).body.token;
const lucia = (await login('lucia', 'Clave123!')).body.token;
const marco = (await login('marco', 'Clave123!')).body.token;
const rosa = (await login('rosa', 'Clave123!')).body.token;
check('tokens obtenidos', admin && lucia && marco && rosa);
check('sin token → 401', (await api('GET', '/api/productos')).status === 401);

console.log('Catálogo público');
const cat = await api('GET', '/api/publico/catalogo');
check('catálogo sin login', cat.status === 200 && cat.body.length > 0);
check('catálogo no expone precio_compra', !('precio_compra' in cat.body[0]));
check('detalle público', (await api('GET', '/api/publico/catalogo/1')).body.detalle?.modelo);

console.log('Productos y permisos');
const prodV = await api('GET', '/api/productos', { token: lucia });
check('vendedor no ve precio_compra', !('precio_compra' in prodV.body[0]));
check('almacenero sí ve precio_compra', 'precio_compra' in (await api('GET', '/api/productos', { token: rosa })).body[0]);
check('vendedor no crea productos → 403', (await api('POST', '/api/productos', { token: lucia, body: {} })).status === 403);
const nuevo = await api('POST', '/api/productos', { token: rosa, body: {
  codigo: 'ACC-TEST-01', nombre: 'Cable USB-C test', tipo_producto: 'Accesorio', precio_compra: 10, precio_venta: 25,
  id_marca: 7, id_categoria: 1, detalle: { tipo_accesorio: 'Cable' } } });
check('almacenero crea accesorio', nuevo.status === 201, nuevo.body);
check('código duplicado → 409', (await api('POST', '/api/productos', { token: rosa, body: {
  codigo: 'ACC-TEST-01', nombre: 'x', tipo_producto: 'Accesorio', precio_compra: 1, precio_venta: 2, id_marca: 7, id_categoria: 1,
  detalle: { tipo_accesorio: 'Cable' } } })).status === 409);

console.log('Compras');
const stock = async (idp, alm = 1) =>
  (await api('GET', `/api/inventario?id_producto=${idp}&id_almacen=${alm}`, { token: admin })).body[0]?.stock_actual ?? 0;
const s5 = await stock(5);
const compra = await api('POST', '/api/compras', { token: rosa, body: {
  id_proveedor: 1, numero_factura: 'F-TEST-1', id_metodo_pago: 1, id_almacen: 1,
  items: [{ id_producto: 5, cantidad: 10, precio_unitario: 20 },
          { id_producto: 1, cantidad: 2, precio_unitario: 1200, imeis: ['356901999999991', { imei: '356901999999992', numero_serie: 'SN-T2' }] }] } });
check('compra registrada', compra.status === 201, compra.body);
check('stock accesorio +10', (await stock(5)) === s5 + 10);
check('total compra = 10*20 + 2*1200', compra.body.total === 2600, compra.body.total);
check('IMEI duplicado → 409', (await api('POST', '/api/compras', { token: rosa, body: { id_proveedor: 1, id_almacen: 1,
  items: [{ id_producto: 1, cantidad: 1, precio_unitario: 1, imeis: ['356901999999991'] }] } })).status === 409);
check('celular sin imeis → 400', (await api('POST', '/api/compras', { token: rosa, body: { id_proveedor: 1, id_almacen: 1,
  items: [{ id_producto: 1, cantidad: 2, precio_unitario: 1 }] } })).status === 400);
check('vendedor no compra → 403', (await api('POST', '/api/compras', { token: lucia, body: {} })).status === 403);

console.log('Ventas');
const s1 = await stock(1);
const venta = await api('POST', '/api/ventas', { token: lucia, body: {
  id_cliente: 3, id_metodo_pago: 1, id_almacen: 1, facturar: true,
  items: [{ id_producto: 1, cantidad: 1, imeis: ['356901999999991'] }, { id_producto: 5, cantidad: 2 }] } });
check('venta creada', venta.status === 201, venta.body);
const idV = venta.body.id_venta;
check('stock celular -1', (await stock(1)) === s1 - 1);
check('IMEI quedó Vendido', (await api('GET', '/api/inventario/unidades?imei=356901999999991', { token: admin })).body[0].estado === 'Vendido');
check('tiene factura', /^FAC-\d{6}$/.test(venta.body.numero_factura ?? ''), venta.body.numero_factura);
check('genera garantía por IMEI', venta.body.garantias.length >= 1);
const esperado = 1550 + 2 * 45 - 0;
check('total coherente (subtotal ± promo)', venta.body.subtotal <= esperado && venta.body.subtotal > 0, venta.body.subtotal);
check('mismo IMEI otra vez → 400', (await api('POST', '/api/ventas', { token: lucia, body: { id_cliente: 3, id_metodo_pago: 1, id_almacen: 1,
  items: [{ id_producto: 1, cantidad: 1, imeis: ['356901999999991'] }] } })).status === 400);
check('IMEI de otro producto → 400', (await api('POST', '/api/ventas', { token: lucia, body: { id_cliente: 3, id_metodo_pago: 1, id_almacen: 1,
  items: [{ id_producto: 2, cantidad: 1, imeis: ['356901999999992'] }] } })).status === 400);
check('stock insuficiente → 4xx', [400, 409].includes((await api('POST', '/api/ventas', { token: lucia, body: { id_cliente: 3, id_metodo_pago: 1, id_almacen: 1,
  items: [{ id_producto: 8, cantidad: 9999 }] } })).status));
check('venta fallida no dejó residuos', (await stock(8)) === 30);
check('descuento mayor al total → 400', (await api('POST', '/api/ventas', { token: lucia, body: { id_cliente: 3, id_metodo_pago: 1, id_almacen: 1, descuento: 99999,
  items: [{ id_producto: 5, cantidad: 1 }] } })).status === 400);
check('técnico no vende → 403', (await api('POST', '/api/ventas', { token: marco, body: {} })).status === 403);

console.log('Reparaciones');
const unidadVendida = (await api('GET', '/api/inventario/unidades?imei=356901999999991', { token: admin })).body[0].id_unidad;
const rep = await api('POST', '/api/reparaciones', { token: marco, body: { id_cliente: 3, falla_reportada: 'No carga', id_unidad: unidadVendida } });
check('reparación con garantía vigente', rep.status === 201 && rep.body.id_garantia, rep.body);
check('reparación de otro cliente → 400', (await api('POST', '/api/reparaciones', { token: marco, body: { id_cliente: 1, falla_reportada: 'x', id_unidad: unidadVendida } })).status === 400);
check('origen ambiguo → 400', (await api('POST', '/api/reparaciones', { token: marco, body: { id_cliente: 1, falla_reportada: 'x' } })).status === 400);
const ext = await api('POST', '/api/reparaciones', { token: marco, body: { id_cliente: 1, falla_reportada: 'Pantalla rota',
  equipo: { imei: '111222333444555', modelo: 'Galaxy S10', id_marca: 1 } } });
check('equipo externo', ext.status === 201 && ext.body.equipo_externo === true, ext.body);
const rp = (await api('GET', '/api/reparaciones/repuestos', { token: marco })).body[0];
const addRp = await api('POST', `/api/reparaciones/${ext.body.id_reparacion}/repuestos`, { token: marco, body: { id_repuesto: rp.id_repuesto, cantidad: 1 } });
check('repuesto agregado y costo calculado', addRp.status === 201 && addRp.body.costo_repuestos === rp.precio, addRp.body);
check('stock repuesto -1', (await api('GET', '/api/reparaciones/repuestos', { token: marco })).body.find((r) => r.id_repuesto === rp.id_repuesto).stock === rp.stock - 1);
const conMano = await api('PATCH', `/api/reparaciones/${ext.body.id_reparacion}`, { token: marco, body: { costo_mano_obra: 50, estado: 'Listo' } });
check('cobro = mano de obra + repuesto', conMano.body.a_cobrar === 50 + rp.precio, conMano.body);
check('con garantía a cobrar 0', (await api('PATCH', `/api/reparaciones/${rep.body.id_reparacion}`, { token: marco, body: { costo_mano_obra: 80 } })).body.a_cobrar === 0);
const entreg = await api('PATCH', `/api/reparaciones/${ext.body.id_reparacion}`, { token: marco, body: { estado: 'Entregado' } });
check('entregada con fecha real', entreg.body.estado === 'Entregado' && entreg.body.fecha_entrega_real);
check('no se edita una entregada → 400', (await api('PATCH', `/api/reparaciones/${ext.body.id_reparacion}`, { token: marco, body: { estado: 'Listo' } })).status === 400);

console.log('Anulación de venta');
check('vendedor no anula → 403', (await api('PATCH', `/api/ventas/${idV}/anular`, { token: lucia })).status === 403);
check('con reparación en curso no anula → 400', (await api('PATCH', `/api/ventas/${idV}/anular`, { token: admin })).status === 400);
await api('PATCH', `/api/reparaciones/${rep.body.id_reparacion}`, { token: marco, body: { estado: 'Cancelado' } });
const anul = await api('PATCH', `/api/ventas/${idV}/anular`, { token: admin });
check('venta anulada', anul.status === 200 && anul.body.estado === 'Anulada', anul.body);
check('stock repuesto/producto restituido', (await stock(1)) === s1);
check('IMEI otra vez Disponible', (await api('GET', '/api/inventario/unidades?imei=356901999999991', { token: admin })).body[0].estado === 'Disponible');
check('no se anula dos veces → 400', (await api('PATCH', `/api/ventas/${idV}/anular`, { token: admin })).status === 400);

console.log('Inventario y reportes');
check('conciliación sin descuadres', (await api('GET', '/api/inventario/conciliacion', { token: admin })).body.length === 0);
const tr = await api('POST', '/api/inventario/movimientos', { token: rosa, body: { tipo_movimiento: 'Traslado', id_producto: 1, cantidad: 1,
  id_almacen_origen: 1, id_almacen_destino: 2, imeis: ['356901999999992'], motivo: 'Reposición Viacha' } });
check('traslado de celular por IMEI', tr.status === 201, tr.body);
check('conciliación tras traslado', (await api('GET', '/api/inventario/conciliacion', { token: admin })).body.length === 0);
const res = await api('GET', '/api/reportes/resumen', { token: admin });
check('resumen del panel', res.status === 200 && res.body.reparaciones_por_estado, res.body);
check('resumen solo admin', (await api('GET', '/api/reportes/resumen', { token: lucia })).status === 403);
check('usuarios solo admin', (await api('GET', '/api/usuarios', { token: lucia })).status === 403);

console.log(`\n${ok} comprobaciones correctas${process.exitCode ? ' — HAY FALLAS' : ''}`);
server.close();
await pool.end();
