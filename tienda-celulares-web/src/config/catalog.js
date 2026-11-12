// Valores que coinciden con producto.tipo_producto en la base de datos.
export const PRODUCT_TYPES = [
  { value: 'Celular', label: 'Celulares' },
  { value: 'Accesorio', label: 'Accesorios' },
  { value: 'Dispositivo', label: 'Dispositivos' },
];

export const SORT_OPTIONS = [
  { value: 'nombre', label: 'Nombre (A-Z)' },
  { value: 'precio_asc', label: 'Menor precio' },
  { value: 'precio_desc', label: 'Mayor precio' },
];

export const DEFAULT_SORT = 'nombre';

// Máximo de productos que pide el catálogo a la API (su tope es 200).
// Si la tienda crece más allá de esto, hay que agregar paginación.
export const CATALOG_LIMIT = 200;
