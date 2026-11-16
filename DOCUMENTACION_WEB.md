# FX TECHNOLOGY — Documentación del diseño web

## Framework CSS
- **Bulma 1.0.4** (no es Bootstrap). Se instala con `npm install bulma@1.0.4` y se carga en `src/main.jsx` con
  `import 'bulma/css/bulma.min.css'`.
- Componentes de Bulma usados: `navbar`, `hero`, `columns`, `card`, `box`, `button`, `tag`, `table`, `field/control/input/select/textarea`,
  `pagination`, `breadcrumb`, `notification`, `modal`, `menu`, `progress`, `loader`, `footer`, `title/subtitle`.
- Sobre Bulma se ajusta la identidad con sus variables CSS (`--bulma-primary-h`, etc.) en `src/styles/global.css`.
  Los CSS Modules propios solo añaden detalles que Bulma no trae (ilustraciones de producto, barras del gráfico, etc.).

## Identidad visual
- **Logo:** el de FX TECHNOLOGY (`public/logo-192.png`), sobre fondo negro como en el original.
- **Paleta:** negro `#000` (barra, portada, pie), azul eléctrico `#0a6fdb` / `#0a84ff` (acciones y acentos), blanco y gris azulado `#f4f7fb` (fondo),
  naranja `#e8590c` solo para descuentos.
- **Tipografías:** Bricolage Grotesque (títulos) y Figtree (texto), incluidas en el proyecto con `@fontsource-variable`.
- **Justificación:** el negro y el azul vienen del logo, así la tienda se ve como una sola marca; el azul se reserva para lo que se puede
  pulsar, y el naranja para el precio rebajado, de modo que nada compita por la atención.

## Funciones del sitio
Público: portada, catálogo (búsqueda, tipo, categoría, marca, rango de precio, orden, paginación), detalle con productos relacionados,
**comparador de hasta 3 productos**, promociones, **consulta del estado de una reparación** (N° de orden + CI), contacto y botón flotante de WhatsApp.

Panel interno (por rol): resumen con ventas de los últimos 7 días y **6 meses**, ventas (detalle y anulación), inventario, productos (con foto),
reparaciones; todas las tablas con **buscador, paginación, exportar a CSV e imprimir/PDF**; **cambio de contraseña** de cada usuario.

## Qué debes completar tú (el examen pide documentar el uso de OpenCode)
1. Los *prompts* reales que le diste a OpenCode, en orden.
2. Un ajuste manual que hiciste tú y por qué.
3. Capturas del sitio funcionando.
