import { env } from '../config/env';
import { request } from './httpClient';

// Envía el pedido del carrito. La API calcula los precios; aquí solo se mandan ids y cantidades.
export const orderApi = {
  create: ({ nombre, telefono, ci, notas, lines }) => {
    const items = lines.map((l) => ({ id_producto: l.id, cantidad: l.cantidad }));
    if (env.useMock) {
      // Modo de datos de ejemplo (sin servidor): simula la respuesta.
      return Promise.resolve({
        id_pedido: 1,
        total: lines.reduce((sum, l) => sum + l.cantidad * l.precio, 0),
        items: lines.map((l) => ({ nombre: l.nombre, cantidad: l.cantidad, precio_unitario: l.precio })),
      });
    }
    return request('/publico/pedidos', { method: 'POST', body: { nombre, telefono, ci, notas, items } });
  },
};
