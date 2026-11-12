import { request } from '../httpClient';

// Recursos del panel interno. Todos exigen sesión; la API decide qué rol puede qué.
export const reportsApi = {
  summary: () => request('/reportes/resumen'),
};

export const salesApi = {
  list: (params) => request('/ventas', { params }),
  get: (id) => request(`/ventas/${id}`),
  create: (body) => request('/ventas', { method: 'POST', body }),
  cancel: (id) => request(`/ventas/${id}/anular`, { method: 'PATCH' }),
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
};
