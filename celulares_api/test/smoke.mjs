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

console.log('Catálogo: orden y reparación pública');
const desc = (await api('GET', '/api/publico/catalogo?orden=precio_desc')).body.map((p) => Number(p.precio_venta));
check('orden por precio descendente', desc.length > 1 && desc.every((v, i) => i === 0 || desc[i - 1] >= v), desc);
const asc = (await api('GET', '/api/publico/catalogo?orden=precio_asc')).body.map((p) => Number(p.precio_venta));
check('orden por precio ascendente', asc.length > 1 && asc.every((v, i) => i === 0 || asc[i - 1] <= v), asc);
check('reparación pública con N° y CI correctos', (await api('GET', '/api/publico/reparacion?codigo=2&ci=8456123')).body.estado === 'En reparacion');
check('reparación pública con CI ajeno → 404', (await api('GET', '/api/publico/reparacion?codigo=2&ci=9999')).status === 404);
check('reparación pública sin CI → 404', (await api('GET', '/api/publico/reparacion?codigo=2')).status === 404);

console.log('Autenticación');
check('login incorrecto → 401', (await login('admin', 'mala')).status === 401);
const admin = (await login('admin', 'Admin123!')).body.token;
const lucia = (await login('lucia', 'Clave123!')).body.token;
const marco = (await login('marco', 'Clave123!')).body.token;
const rosa = (await login('rosa', 'Clave123!')).body.token;
check('tokens obtenidos', admin && lucia && marco && rosa);
check('sin token → 401', (await api('GET', '/api/productos')).status === 401);

console.log('Pedidos y fotos');
const prod = (await api('GET', '/api/publico/catalogo?orden=precio_asc')).body[0];
const ped = await api('POST', '/api/publico/pedidos', { body: { nombre: 'Ana Prueba', telefono: '71234567', items: [{ id_producto: prod.id_producto, cantidad: 1 }] } });
check('pedido público creado', ped.status === 201 && ped.body.id_pedido && ped.body.total === Number(prod.precio_final), ped.body);
check('pedido sin teléfono → 400', (await api('POST', '/api/publico/pedidos', { body: { nombre: 'Ana', telefono: 'x', items: [{ id_producto: prod.id_producto, cantidad: 1 }] } })).status === 400);
check('pedido con cantidad excesiva → 400', (await api('POST', '/api/publico/pedidos', { body: { nombre: 'Ana', telefono: '71234567', items: [{ id_producto: prod.id_producto, cantidad: 99 }] } })).status === 400);
check('pedido con producto inexistente → 409', (await api('POST', '/api/publico/pedidos', { body: { nombre: 'Ana', telefono: '71234567', items: [{ id_producto: 999999, cantidad: 1 }] } })).status === 409);
check('el precio lo calcula el servidor', (await api('POST', '/api/publico/pedidos', { body: { nombre: 'Ana', telefono: '71234567', items: [{ id_producto: prod.id_producto, cantidad: 2, precio_unitario: 1 }] } })).body.total === 2 * Number(prod.precio_final));
check('pedidos exigen sesión', (await api('GET', '/api/pedidos')).status === 401);
check('técnico no ve pedidos → 403', (await api('GET', '/api/pedidos', { token: marco })).status === 403);
const lista = await api('GET', '/api/pedidos?estado=Nuevo', { token: lucia });
check('vendedor lista pedidos nuevos', lista.status === 200 && lista.body.some((p) => p.id_pedido === ped.body.id_pedido), lista.body);
const det = await api('GET', `/api/pedidos/${ped.body.id_pedido}`, { token: lucia });
check('detalle del pedido con ítems', det.body.items?.length === 1 && det.body.estado === 'Nuevo', det.body);
check('Nuevo → Entregado no se permite (409)', (await api('PATCH', `/api/pedidos/${ped.body.id_pedido}/estado`, { token: lucia, body: { estado: 'Entregado' } })).status === 409);
check('Nuevo → Confirmado', (await api('PATCH', `/api/pedidos/${ped.body.id_pedido}/estado`, { token: lucia, body: { estado: 'Confirmado' } })).status === 200);
check('Confirmado → Entregado', (await api('PATCH', `/api/pedidos/${ped.body.id_pedido}/estado`, { token: lucia, body: { estado: 'Entregado' } })).status === 200);
check('Entregado es final (409)', (await api('PATCH', `/api/pedidos/${ped.body.id_pedido}/estado`, { token: lucia, body: { estado: 'Cancelado' } })).status === 409);
// Foto guardada en la base: 1x1 PNG
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const fd = new FormData(); fd.append('foto', new Blob([png], { type: 'image/png' }), 'x.png');
const up = await fetch(`${base}/api/productos/${prod.id_producto}/foto`, { method: 'POST', headers: { Authorization: `Bearer ${rosa}` }, body: fd });
const upJson = await up.json();
check('foto se guarda en la base', up.status === 200 && upJson.foto_url.startsWith('/api/publico/foto/'), upJson);
const got = await fetch(base + upJson.foto_url);
check('foto se sirve con su tipo', got.status === 200 && got.headers.get('content-type') === 'image/png' && Buffer.from(await got.arrayBuffer()).equals(png));
const fd2 = new FormData(); fd2.append('foto', new Blob([Buffer.from('no soy una imagen')], { type: 'image/png' }), 'x.png');
check('archivo falso se rechaza (400)', (await fetch(`${base}/api/productos/${prod.id_producto}/foto`, { method: 'POST', headers: { Authorization: `Bearer ${rosa}` }, body: fd2 })).status === 400);

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
check('resumen trae ventas por mes', Array.isArray(res.body.ventas_ultimos_6_meses), res.body)
check('resumen solo admin', (await api('GET', '/api/reportes/resumen', { token: lucia })).status === 403);
check('usuarios solo admin', (await api('GET', '/api/usuarios', { token: lucia })).status === 403);

console.log('Fase 2: caja, crédito, reportes y bitácora');
const acc = (await pool.query("SELECT p.id_producto, p.precio_venta FROM celulares.producto p JOIN celulares.inventario i USING (id_producto) WHERE p.tipo_producto = 'Accesorio' AND p.estado = 'Activo' AND i.stock_actual >= 6 LIMIT 1")).rows[0];
check('hay un accesorio para probar', !!acc, acc);
check('caja: sin abrir no hay actual', (await api('GET', '/api/caja/actual', { token: lucia })).body === null);
check('caja: no se mueve sin abrir → 400', (await api('POST', '/api/caja/movimiento', { token: lucia, body: { tipo: 'Egreso', monto: 5, concepto: 'x' } })).status === 400);
check('caja: técnico no abre → 403', (await api('POST', '/api/caja/abrir', { token: marco, body: { monto_inicial: 100 } })).status === 403);
check('caja: monto negativo → 400', (await api('POST', '/api/caja/abrir', { token: lucia, body: { monto_inicial: -1 } })).status === 400);
const aper = await api('POST', '/api/caja/abrir', { token: lucia, body: { monto_inicial: 100 } });
check('caja: abre', aper.status === 201 && aper.body.estado === 'Abierta', aper.body);
check('caja: no abre dos → 400', (await api('POST', '/api/caja/abrir', { token: lucia, body: { monto_inicial: 5 } })).status === 400);

const vE = await api('POST', '/api/ventas', { token: lucia, body: { id_cliente: 1, id_metodo_pago: 1, items: [{ id_producto: acc.id_producto, cantidad: 2 }] } });
check('venta al contado en efectivo', vE.status === 201, vE.body);
const vQ = await api('POST', '/api/ventas', { token: lucia, body: { id_cliente: 1, id_metodo_pago: 3, items: [{ id_producto: acc.id_producto, cantidad: 1 }] } });
check('venta por QR', vQ.status === 201, vQ.body);
const unit = Number(acc.precio_venta);
const vC = await api('POST', '/api/ventas', { token: lucia, body: { id_cliente: 1, id_metodo_pago: 1, credito: { adelanto: unit / 2, vence: '2030-01-01' }, items: [{ id_producto: acc.id_producto, cantidad: 2 }] } });
check('venta a crédito con adelanto', vC.status === 201 && Math.abs(vC.body.saldo_credito - (2 * unit - unit / 2)) < 0.01, vC.body);
check('adelanto mayor al total → 400', (await api('POST', '/api/ventas', { token: lucia, body: { id_cliente: 1, id_metodo_pago: 1, credito: { adelanto: 999999 }, items: [{ id_producto: acc.id_producto, cantidad: 1 }] } })).status === 400);
const egr = await api('POST', '/api/caja/movimiento', { token: lucia, body: { tipo: 'Egreso', monto: 10, concepto: 'Pasajes' } });
check('egreso de caja', egr.status === 201, egr.body);

const cuentas = await api('GET', '/api/cuentas', { token: lucia });
const cta = cuentas.body.find((x) => x.id_venta === vC.body.id_venta);
check('cuenta por cobrar listada', !!cta && cta.estado === 'Pendiente', cuentas.body);
check('abono mayor al saldo → 400', (await api('POST', `/api/cuentas/${cta.id_cuenta}/abonos`, { token: lucia, body: { monto: 99999, id_metodo_pago: 1 } })).status === 400);
const ab1 = await api('POST', `/api/cuentas/${cta.id_cuenta}/abonos`, { token: lucia, body: { monto: unit / 2, id_metodo_pago: 1 } });
check('abono parcial baja el saldo', ab1.status === 201 && Math.abs(ab1.body.saldo - unit) < 0.01, ab1.body);
check('resumen por cobrar', (await api('GET', '/api/cuentas/resumen', { token: lucia })).body.por_cobrar >= unit);
check('técnico no ve cuentas → 403', (await api('GET', '/api/cuentas', { token: marco })).status === 403);

const act = (await api('GET', '/api/caja/actual', { token: lucia })).body;
// efectivo = 100 inicial + 2*unit (contado) + unit/2 (adelanto) + unit/2 (abono) - 10 egreso
const esperadoCaja = Math.round((100 + 2 * unit + unit / 2 + unit / 2 - 10) * 100) / 100;
check('caja: efectivo esperadoCaja correcto', Math.abs(act.esperado_calculado - esperadoCaja) < 0.01, { esperadoCaja, got: act.esperado_calculado });
check('caja: QR separado del efectivo', act.cobros.find((x) => x.metodo === 'Transferencia QR')?.total === unit, act.cobros);
const cierre = await api('POST', '/api/caja/cerrar', { token: lucia, body: { monto_contado: esperadoCaja - 5, observacion: 'faltan 5' } });
check('caja: cierra con diferencia -5', cierre.status === 200 && cierre.body.estado === 'Cerrada' && Math.abs(cierre.body.diferencia + 5) < 0.01, cierre.body);
check('caja: no cierra dos veces → 400', (await api('POST', '/api/caja/cerrar', { token: lucia, body: { monto_contado: 1 } })).status === 400);
check('caja: historial propio', (await api('GET', '/api/caja', { token: lucia })).body.length === 1);

// pagar el resto → Pagada
const ab2 = await api('POST', `/api/cuentas/${cta.id_cuenta}/abonos`, { token: lucia, body: { monto: unit, id_metodo_pago: 3 } });
check('cuenta saldada pasa a Pagada', ab2.body.estado === 'Pagada' && ab2.body.saldo === 0, ab2.body);
check('no se abona a cuenta pagada → 400', (await api('POST', `/api/cuentas/${cta.id_cuenta}/abonos`, { token: lucia, body: { monto: 1, id_metodo_pago: 1 } })).status === 400);

const rv = await api('GET', '/api/reportes/ventas', { token: admin });
check('reporte de ventas con utilidad', rv.status === 200 && rv.body.total > 0 && typeof rv.body.utilidad === 'number' && rv.body.por_vendedor.length > 0 && rv.body.por_marca.length > 0, rv.body);
check('reporte con rango futuro vacío', (await api('GET', '/api/reportes/ventas?desde=2099-01-01&hasta=2099-12-31', { token: admin })).body.ventas === 0);
check('reporte de ventas solo admin', (await api('GET', '/api/reportes/ventas', { token: lucia })).status === 403);
const repo = await api('GET', '/api/reportes/reposicion', { token: rosa });
check('reposición sugerida', repo.status === 200 && Array.isArray(repo.body), repo.body);

const price = await api('PUT', `/api/productos/${acc.id_producto}`, { token: rosa, body: { precio_venta: unit + 1 } });
check('cambio de precio', price.status === 200, price.body);
const vAn = await api('PATCH', `/api/ventas/${vC.body.id_venta}/anular`, { token: admin, body: { motivo: 'Error de digitación' } });
check('anular venta a crédito', vAn.status === 200, vAn.body);
check('cuenta anulada sale del listado', !(await api('GET', '/api/cuentas', { token: admin })).body.some((x) => x.id_venta === vC.body.id_venta));
const bita = await api('GET', '/api/bitacora', { token: admin });
const acciones = bita.body.map((b) => b.accion);
check('bitácora registra apertura, cierre, precio y anulación',
  ['Apertura de caja', 'Cierre de caja', 'Cambio de precio', 'Anular venta', 'Abono'].every((a) => acciones.includes(a)), acciones);
check('bitácora guarda quién fue', bita.body.some((b) => b.accion === 'Anular venta' && b.usuario === 'admin' && /Error de digitaci/.test(b.detalle)), bita.body[0]);
check('bitácora solo admin', (await api('GET', '/api/bitacora', { token: lucia })).status === 403);
check('conciliación sigue en cero', (await api('GET', '/api/inventario/conciliacion', { token: admin })).body.length === 0);

console.log('Fase 3: garantía por IMEI, aviso de reparación, resumen');
const rSeed = (await api('GET', '/api/reparaciones/2', { token: admin })).body; // reparación de ejemplo: equipo vendido por la tienda
const imeiV = rSeed.imei;
const gp = await api('GET', `/api/publico/garantia?imei=${imeiV}`);
check('garantía pública por IMEI', gp.status === 200 && gp.body.modelo && gp.body.fecha_fin && gp.body.estado, gp.body);
check('garantía pública no expone datos del cliente', !('cliente' in gp.body) && !('id_cliente' in gp.body) && !('id_venta' in gp.body), gp.body);
check('garantía pública IMEI inexistente → 404', (await api('GET', '/api/publico/garantia?imei=123456789012345')).status === 404);
check('garantía pública IMEI corto → 404', (await api('GET', '/api/publico/garantia?imei=123')).status === 404);
const gadm = await api('GET', `/api/garantias/imei/${imeiV}`, { token: lucia });
check('garantía en panel: cliente, venta y garantías', gadm.status === 200 && gadm.body.cliente && gadm.body.garantias.length >= 1 && Array.isArray(gadm.body.reparaciones), gadm.body);
check('garantía en panel exige sesión', (await api('GET', `/api/garantias/imei/${imeiV}`)).status === 401);
check('garantía en panel: IMEI desconocido → 404', (await api('GET', '/api/garantias/imei/000000000000000', { token: lucia })).status === 404);
check('la reparación de ejemplo aparece en la unidad', gadm.body.reparaciones.some((x) => x.id_reparacion === 2), gadm.body.reparaciones);
check('la venta del equipo está vigente', gadm.body.garantias.some((g) => g.estado === 'Vigente'), gadm.body.garantias);

const rNew = await api('POST', '/api/reparaciones', { token: marco, body: { id_cliente: 1, falla_reportada: 'Pantalla rota', equipo: { modelo: 'Redmi 12', id_marca: 1 } } });
check('nueva reparación externa', rNew.status === 201, rNew.body);
const rdet = await api('GET', `/api/reparaciones/${rNew.body.id_reparacion}`, { token: marco });
check('reparación trae teléfono del cliente', rdet.status === 200 && 'cliente_telefono' in rdet.body, rdet.body);
const rlisto = await api('PATCH', `/api/reparaciones/${rNew.body.id_reparacion}`, { token: marco, body: { estado: 'Listo', diagnostico: 'Cambio de conector', costo_mano_obra: 30 } });
check('técnico marca la reparación Listo', rlisto.status === 200 && rlisto.body.estado === 'Listo', rlisto.body);
check('vendedor no cambia reparaciones → 403', (await api('PATCH', `/api/reparaciones/${rNew.body.id_reparacion}`, { token: lucia, body: { estado: 'Entregado' } })).status === 403);
const bit3 = (await api('GET', '/api/bitacora?accion=Reparaci', { token: admin })).body;
check('bitácora registra el cambio de reparación', bit3.some((b) => b.accion === 'Reparación Listo' && b.usuario === 'marco'), bit3);
const rs = (await api('GET', '/api/reportes/resumen', { token: admin })).body;
check('resumen trae por cobrar y cajas abiertas', rs.por_cobrar && typeof rs.cajas_abiertas === 'number', rs);

console.log('Fase 4: respaldo');
const resp = await fetch(`${base}/api/respaldo`, { headers: { Authorization: `Bearer ${admin}` } });
const resp_json = await resp.json();
check('respaldo: descarga todas las tablas', resp.status === 200 && Object.keys(resp_json.tablas).length >= 41 && /attachment/.test(resp.headers.get('content-disposition')), Object.keys(resp_json.tablas ?? {}).length);
check('respaldo: incluye ventas y usuarios', resp_json.tablas.venta.length > 0 && resp_json.tablas.usuario.length >= 4);
check('respaldo solo admin', (await api('GET', '/api/respaldo', { token: lucia })).status === 403);
check('respaldo queda en la bitácora y en el resumen', (await api('GET', '/api/reportes/resumen', { token: admin })).body.ultimo_respaldo != null);

console.log(`\n${ok} comprobaciones correctas${process.exitCode ? ' — HAY FALLAS' : ''}`);
server.close();
await pool.end();
