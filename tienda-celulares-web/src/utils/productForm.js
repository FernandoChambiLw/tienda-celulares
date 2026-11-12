import { TYPE_FIELDS } from '../config/productFields';

export const EMPTY_PRODUCT = {
  tipo_producto: 'Celular',
  codigo: '',
  nombre: '',
  descripcion: '',
  precio_compra: '',
  precio_venta: '',
  garantia_meses: '0',
  id_marca: '',
  id_categoria: '',
  estado: 'Activo',
  detalle: {},
};

// Del producto que devuelve la API a los valores de los inputs (todo texto, bool queda bool).
export function toFormValues(product) {
  const detalle = {};
  TYPE_FIELDS[product.tipo_producto].forEach(({ name, kind }) => {
    const v = product.detalle?.[name];
    detalle[name] = kind === 'bool' ? Boolean(v) : v ?? '';
  });
  return {
    tipo_producto: product.tipo_producto,
    codigo: product.codigo,
    nombre: product.nombre,
    descripcion: product.descripcion ?? '',
    precio_compra: String(product.precio_compra ?? ''),
    precio_venta: String(product.precio_venta),
    garantia_meses: String(product.garantia_meses),
    id_marca: String(product.id_marca),
    id_categoria: String(product.id_categoria),
    estado: product.estado,
    detalle,
  };
}

// De los valores del formulario al cuerpo que espera la API.
// Los campos opcionales vacíos se envían como null al editar (para poder borrarlos) y se omiten al crear.
export function toPayload(values, { editing }) {
  const blank = (v) => (editing ? null : undefined);
  const clean = (v, kind) => {
    if (kind === 'bool') return Boolean(v);
    if (v === '' || v === undefined) return blank();
    return kind === 'number' ? Number(v) : v.trim();
  };

  const detalle = {};
  TYPE_FIELDS[values.tipo_producto].forEach(({ name, kind }) => {
    const v = clean(values.detalle[name], kind);
    if (v !== undefined) detalle[name] = v;
  });

  const payload = {
    codigo: values.codigo.trim(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion.trim() || blank(),
    precio_compra: Number(values.precio_compra),
    precio_venta: Number(values.precio_venta),
    garantia_meses: Number(values.garantia_meses) || 0,
    id_marca: Number(values.id_marca),
    id_categoria: Number(values.id_categoria),
    estado: values.estado,
    detalle,
  };
  if (!editing) payload.tipo_producto = values.tipo_producto; // el tipo no se cambia después
  return payload;
}
