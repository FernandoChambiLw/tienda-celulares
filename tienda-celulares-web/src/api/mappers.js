import { assetUrl } from '../config/env';
import { buildSpecList } from '../utils/specs';

// La API responde con los nombres de la base de datos (snake_case).
// Estos mappers los convierten al modelo que usa la interfaz. Si la API cambia,
// solo se toca este archivo.

export function mapProduct(raw) {
  const precio = Number(raw.precio_venta);

  return {
    id: raw.id_producto,
    codigo: raw.codigo,
    nombre: raw.nombre,
    descripcion: raw.descripcion,
    tipo: raw.tipo_producto,
    marca: raw.marca,
    categoria: raw.categoria,
    // La lista trae `color`; el detalle lo trae dentro de `detalle`.
    color: raw.color ?? raw.detalle?.color ?? null,
    fotoUrl: raw.foto_url ? assetUrl(raw.foto_url) : null,
    garantiaMeses: raw.garantia_meses,
    disponible: Boolean(raw.disponible),
    precio,
    descuento: Number(raw.promo_porcentaje ?? 0),
    promoNombre: raw.promo_nombre ?? null,
    precioFinal: Number(raw.precio_final ?? precio),
    specs: buildSpecList(raw.tipo_producto, raw.detalle),
  };
}

// /publico/filtros devuelve { marcas: [nombre], categorias: [nombre] }.
export function mapFilters(raw) {
  return { marcas: raw.marcas ?? [], categorias: raw.categorias ?? [] };
}
