# Tienda Móvil — Vitrina web (React)

Vitrina pública de la tienda de celulares: inicio, catálogo con filtros, detalle de producto,
promociones y contacto. Funciona **conectada a tu API** (`celulares_api`) o **con datos de
ejemplo** (sin backend).

## Cómo ejecutarla

Con datos de ejemplo (no necesita nada más):

```bash
npm install
npm run dev              # http://localhost:5173
```

Con tu API real:

1. Deja corriendo la API (`npm start` en `celulares_api`, puerto 3000 por defecto).
2. Crea el archivo `.env` copiando el ejemplo (**copia el archivo, no pegues su contenido
   en la terminal**):

   ```bash
   copy .env.example .env        # Windows
   cp .env.example .env          # Linux / Mac
   ```
3. En `.env` cambia `VITE_USE_MOCK=true` por `VITE_USE_MOCK=false` y reinicia `npm run dev`.

En desarrollo, `vite.config.js` redirige `/api` y `/uploads` a `http://localhost:3000`, así que
no hace falta configurar CORS. Si tu API usa otro puerto, cámbialo en `API_TARGET`.

Otros comandos: `npm run build` (genera `dist/`) y `npm run preview`.

## Contrato con la API

La web usa solo las rutas **públicas** de la API (no piden login):

| Ruta | Parámetros | Uso en la web |
|---|---|---|
| `GET /api/publico/catalogo` | `q`, `tipo`, `marca` (nombre), `categoria` (nombre), `min`, `max`, `orden`, `limit`, `offset` | Catálogo, destacados y promociones |
| `GET /api/publico/catalogo/:id` | — | Detalle (incluye `detalle` con las especificaciones) |
| `GET /api/publico/filtros` | — | Marcas y categorías de los selectores |
| `GET /uploads/<archivo>` | — | Fotos de producto |

- `orden` acepta `nombre`, `precio_asc` y `precio_desc`. **Requiere el parche opcional de
  `publico.js`** (ver más abajo); sin él la API ignora el parámetro y ordena por nombre.
- `color` en la lista (para dibujar el producto con su color cuando no hay foto) también
  viene en ese parche. Sin él, los productos sin foto se dibujan en verde.
- La API solo lista productos **activos y con stock** y no revela cuántas unidades quedan:
  por eso la web muestra "Disponible" y no "Últimas N unidades".
- Las promociones salen de los productos que traen `promo_porcentaje` (promoción vigente hoy).
- `foto_url` llega como ruta relativa (`/uploads/abc.png`). En producción, si las fotos se sirven
  desde otro dominio, define `VITE_ASSETS_URL`.
- La búsqueda de la API distingue tildes: "audifonos" no encuentra "Audífonos". Ver `REVISION_API.md`.

## Estructura y reglas

```
src/
  config/        env.js, site.js (nombre, contacto), catalog.js (tipos, orden, límite)
  api/           httpClient.js (único lugar con fetch), transport.js (real o mock),
                 productsApi / catalogApi, mappers.js, mock/ (imita a la API real)
  hooks/         useAsync y hooks de datos (useProducts, useOffers...), useCatalogFilters
  utils/         format.js, specs.js, illustration.js, whatsapp.js (funciones puras)
  components/
    ui/          piezas genéricas reutilizables (Spinner, AsyncView, SelectField...)
    layout/      Header, Footer, Layout
    products/    ProductCard, ProductGrid, ProductFilters, ProductSpecs, Illustration...
    home/        HeroArt
  pages/         una por ruta; solo arman componentes y hooks
  styles/        global.css (variables y utilidades); el resto son CSS Modules por componente
```

Reglas para que no se vuelva código espagueti:

1. **Las páginas no llaman a `fetch`.** Usan un hook (`useProducts`), que usa un módulo `*Api`.
2. **Los componentes no conocen la API.** Reciben datos ya listos por props.
3. **Los nombres de la base de datos (`precio_venta`) se traducen en `api/mappers.js`.** La
   interfaz usa `precio`. Si el backend cambia, se arregla en un solo archivo.
4. **Nada de textos o valores fijos repetidos:** nombre de tienda, contacto y tipos viven en `config/`.
5. **Cada componente tiene su propio CSS Module**, así los estilos no chocan entre sí.
6. **Los filtros del catálogo viven en la URL** (`/catalogo?tipo=Celular&marca=Samsung`): el botón
   "atrás" funciona y las búsquedas se pueden compartir.
7. **El mock imita a la API real** (mismas rutas, campos y comportamiento), así que cambiar
   entre mock y API no cambia nada más.

## Diseño y rendimiento

- **Colores y medidas:** variables en `src/styles/global.css` (escala verde 50-950, crema,
  terracota para ofertas). Cambiar la paleta es editar ese bloque.
- **Tipografía:** Bricolage Grotesque (títulos) y Figtree (texto), servidas desde el propio
  proyecto, sin pedirlas a Google. Solo se descarga el subconjunto latino.
- **Sin foto:** cada producto se dibuja con una ilustración SVG con su color real. Cuando el
  producto tiene `foto_url`, la foto la reemplaza sola.
- **Fotos reales (recomendación):** WebP o AVIF, ~800 × 640 px y menos de 80 KB cada una.
- **Carga diferida por página**, animaciones solo con `transform`/`opacity` y desactivadas si
  el dispositivo lo pide (`prefers-reduced-motion`).
- **Medido en la portada (celular, primera visita):** ~357 KB sin comprimir (~120 KB con gzip),
  sin desborde horizontal y sin errores de consola.

## Panel interno (`/panel`)

Entrar en `/panel/login` con un usuario de la API (pruebas: `admin / Admin123!`, `lucia`, `marco`, `rosa` / `Clave123!`).
**Necesita la API real** (`VITE_USE_MOCK=false`); con datos de ejemplo el login avisa y se bloquea.

| Rol | Ve |
|---|---|
| Administrador | Resumen del negocio, Ventas (todas, puede anular), Inventario, Reparaciones |
| Vendedor | Resumen (stock por reponer), Ventas propias, Nueva venta, Inventario |
| Técnico | Resumen, Inventario, Reparaciones asignadas |
| Almacenero | Resumen, Inventario, Productos |

- **Sesión:** `api/session.js` guarda el JWT; `httpClient.js` lo envía en cada petición y, si la API responde 401
  (token vencido o usuario bloqueado), `AuthContext` cierra la sesión sola.
- **Rutas protegidas:** `auth/RequireAuth.jsx` (sesión y rol). Es solo comodidad: quien protege los datos es la API.
- **Nueva venta:** cliente → productos (los celulares piden IMEI) → pago. El descuento solo se envía si lo escribes,
  así la API aplica sola las promociones vigentes. Tope del vendedor: 10 % (regla de la API).
- **Productos** (Administrador y Almacenero): listar, crear y editar con sus especificaciones según el tipo
  (celular, accesorio, dispositivo) y subir la foto (JPG/PNG/WEBP, máx. 3 MB). Los campos de cada tipo están en
  `config/productFields.js`: agregar uno es agregar una línea. Para retirar un producto usa el estado
  *Descontinuado* (la API no permite borrar los que ya tienen ventas). Un producto nuevo aparece en la vitrina
  cuando tiene stock (se carga con una compra o un movimiento de inventario).
- Agregar una sección: una línea en `config/panel.js` (menú y roles), una ruta en `App.jsx` y una página en `pages/panel/`.

## Probado de punta a punta

El panel se probó con un navegador real y los 4 roles (30 comprobaciones, incluida la creación de productos con foto): redirección sin sesión, clave incorrecta,
menú por rol, acceso denegado a secciones ajenas, venta completa con IMEI, anulación por el Administrador,
cierre de sesión automático al bloquear a un usuario y vista móvil sin desborde.

Además, la vitrina pública:

Se probó contra la API real con PostgreSQL 16: catálogo, filtros, búsqueda, orden, detalle,
404, promociones y una foto subida por `POST /api/productos/:id/foto` mostrada desde `/uploads`.

## Pendiente

- Reemplazar nombre, logo y contacto en `src/config/site.js` y `components/layout/Logo.jsx`.
  **El número de WhatsApp actual es un marcador (`59170000000`).**
- Panel: clientes, compras, ingreso de stock/IMEI y reparaciones con cambio de estado (hoy: consulta, ventas y productos).
- Consulta pública de estado de reparación y garantía por IMEI (requiere una ruta pública nueva).
- Paginación del catálogo si la tienda pasa de 200 productos (`CATALOG_LIMIT`).
- En el mock, la promoción "Semana del cargador (demo)" existe solo para la demostración.
