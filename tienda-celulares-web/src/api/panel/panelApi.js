import { request } from '../httpClient';

// Recursos del panel interno. Todos exigen sesión; la API decide qué rol puede qué.
export const reportsApi = {
  summary: () => request('/reportes/resumen'),
  sales: (params) => request('/reportes/ventas', { params }),
  restock: () => request('/reportes/reposicion'),
};

export const cashApi = {
  current: () => request('/caja/actual'),
  list: (params) => request('/caja', { params }),
  get: (id) => request(`/caja/${id}`),
  open: (monto_inicial) => request('/caja/abrir', { method: 'POST', body: { monto_inicial } }),
  move: (body) => request('/caja/movimiento', { method: 'POST', body }),
  close: (body) => request('/caja/cerrar', { method: 'POST', body }),
};

export const accountsApi = {
  list: (params) => request('/cuentas', { params }),
  summary: () => request('/cuentas/resumen'),
  get: (id) => request(`/cuentas/${id}`),
  pay: (id, body) => request(`/cuentas/${id}/abonos`, { method: 'POST', body }),
};

export const auditApi = {
  list: (params) => request('/bitacora', { params }),
};

export const salesApi = {
  list: (params) => request('/ventas', { params }),
  get: (id) => request(`/ventas/${id}`),
  create: (body) => request('/ventas', { method: 'POST', body }),
  cancel: (id, motivo) => request(`/ventas/${id}/anular`, { method: 'PATCH', body: { motivo } }),
};

export const inventoryApi = {
  stock: (params) => request('/inventario', { params }),
  alerts: () => request('/inventario/alertas'),
  units: (params) => request('/inventario/unidades', { params }),
};

export const customersApi = {
  list: (params) => request('/clientes', { params }),
};

export const productsAdminApi = {
  list: (params) => request('/productos', { params }),
  get: (id) => request(`/productos/${id}`),
  create: (body) => request('/productos', { method: 'POST', body }),
  update: (id, body) => request(`/productos/${id}`, { method: 'PUT', body }),
  uploadPhoto: (id, file) => {
    const form = new FormData();
    form.append('foto', file);
    return request(`/productos/${id}/foto`, { method: 'POST', body: form });
  },
};

export const lookupsApi = {
  paymentMethods: () => request('/catalogos/metodos-pago'),
  warehouses: () => request('/catalogos/almacenes'),
  brands: () => request('/catalogos/marcas'),
  categories: () => request('/catalogos/categorias'),
};

export const repairsApi = {
  list: (params) => request('/reparaciones', { params }),
  get: (id) => request(`/reparaciones/${id}`),
  update: (id, body) => request(`/reparaciones/${id}`, { method: 'PATCH', body }),
};

export const warrantyAdminApi = {
  byImei: (imei) => request(`/garantias/imei/${encodeURIComponent(imei)}`),
};

export const ordersApi = {
  list: (params) => request('/pedidos', { params }),
  get: (id) => request(`/pedidos/${id}`),
  setStatus: (id, estado) => request(`/pedidos/${id}/estado`, { method: 'PATCH', body: { estado } }),
};
