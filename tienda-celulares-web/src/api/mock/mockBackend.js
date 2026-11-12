import { ApiError } from '../httpClient';
import { productos, promociones } from './data';

// Simula el servidor: mismas rutas, mismos filtros y misma forma de respuesta que
// GET /api/publico/* de la API real (celulares_api/src/routes/publico.js).

const LATENCY_MS = 250;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
const sameText = (a, b) => a.toLowerCase() === b.toLowerCase();
const todayISO = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, hora local

// Promoción vigente de mayor descuento (igual que el LEFT JOIN LATERAL de la API).
function activePromotion(idProducto) {
  const today = todayISO();
  return (
    promociones
      .filter(
        (p) =>
          p.id_producto === idProducto &&
          p.estado === 'Vigente' &&
          today >= p.fecha_inicio &&
          today <= p.fecha_fin,
      )
      .sort((a, b) => b.porcentaje_descuento - a.porcentaje_descuento)[0] ?? null
  );
}

// El catálogo público solo muestra productos activos y con stock.
const isListed = (p) => p.estado === 'Activo' && p.stock_total > 0;

function toPublic(p) {
  const promo = activePromotion(p.id_producto);
  const porcentaje = promo?.porcentaje_descuento ?? null;
  return {
    id_producto: p.id_producto,
    codigo: p.codigo,
    nombre: p.nombre,
    descripcion: p.descripcion,
    tipo_producto: p.tipo_producto,
    precio_venta: p.precio_venta,
    garantia_meses: p.garantia_meses,
    foto_url: p.foto_url,
    marca: p.marca,
    categoria: p.categoria,
    color: p.detalle.color ?? null,
    disponible: p.stock_total > 0,
    promo_porcentaje: porcentaje,
    promo_nombre: promo?.nombre ?? null,
    precio_final: Math.round(p.precio_venta * (1 - (porcentaje ?? 0) / 100) * 100) / 100,
  };
}

const SORTERS = {
  nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
  precio_asc: (a, b) => a.precio_venta - b.precio_venta || SORTERS.nombre(a, b),
  precio_desc: (a, b) => b.precio_venta - a.precio_venta || SORTERS.nombre(a, b),
};

function listCatalog({ q, tipo, marca, categoria, min, max, orden, limit, offset } = {}) {
  let result = productos.filter(isListed);

  // Como el ILIKE de la API: ignora mayúsculas, pero NO las tildes.
  if (q) {
    const needle = q.toLowerCase();
    result = result.filter(
      (p) => p.nombre.toLowerCase().includes(needle) || p.marca.toLowerCase().includes(needle),
    );
  }
  if (tipo) result = result.filter((p) => p.tipo_producto === tipo);
  if (marca) result = result.filter((p) => sameText(p.marca, marca));
  if (categoria) result = result.filter((p) => sameText(p.categoria, categoria));
  if (min) result = result.filter((p) => p.precio_venta >= Number(min));
  if (max) result = result.filter((p) => p.precio_venta <= Number(max));

  const sorter = Object.hasOwn(SORTERS, orden) ? SORTERS[orden] : SORTERS.nombre;
  const size = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const start = Math.max(parseInt(offset, 10) || 0, 0);

  return result.sort(sorter).slice(start, start + size).map(toPublic);
}

function getCatalogItem(id) {
  const product = productos.find((p) => p.id_producto === id && isListed(p));
  if (!product) throw new ApiError('Producto no disponible', 404);
  return {
    ...toPublic(product),
    detalle: { id_producto: product.id_producto, tipo_producto: product.tipo_producto, ...product.detalle },
  };
}

function listFilters() {
  const names = (key) =>
    [...new Set(productos.filter((p) => p.estado === 'Activo').map((p) => p[key]))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    );
  return { marcas: names('marca'), categorias: names('categoria') };
}

const routes = [
  { pattern: /^\/publico\/catalogo$/, handler: (_args, params) => listCatalog(params) },
  { pattern: /^\/publico\/catalogo\/(\d+)$/, handler: ([id]) => getCatalogItem(Number(id)) },
  { pattern: /^\/publico\/filtros$/, handler: () => listFilters() },
];

export async function mockGet(path, params = {}) {
  for (const { pattern, handler } of routes) {
    const match = path.match(pattern);
    if (match) return delay(structuredClone(handler(match.slice(1), params)));
  }
  throw new ApiError('Ruta no encontrada', 404);
}
