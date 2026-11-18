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
Público: portada, **carrito de compras y pedidos** (el pedido queda registrado y se envía por WhatsApp), catálogo (búsqueda, tipo, categoría, marca, rango de precio, orden, paginación), detalle con productos relacionados,
**comparador de hasta 3 productos**, promociones, **consulta del estado de una reparación** (N° de orden + CI), contacto y botón flotante de WhatsApp.

Panel interno (por rol): **pedidos de la tienda en línea** (Nuevo → Confirmado → Entregado/Cancelado), **comprobante de venta imprimible/PDF**, resumen con ventas de los últimos 7 días y **6 meses**, ventas (detalle y anulación), inventario, productos (con foto),
reparaciones; todas las tablas con **buscador, paginación, exportar a CSV e imprimir/PDF**; **cambio de contraseña** de cada usuario.

## Qué debes completar tú (el examen pide documentar el uso de OpenCode)
1. Los *prompts* reales que le diste a OpenCode, en orden.
2. Un ajuste manual que hiciste tú y por qué.
3. Capturas del sitio funcionando.

## Base de datos: extensión 04 (36 tablas; la 05 llega a 42)
`celulares_api/db/04_pedidos_fotos.sql` agrega 3 tablas sobre las 33 originales y una vista:
`pedido`, `detalle_pedido`, `producto_foto` y `v_pedido_total`. Es idempotente y la aplica `init-db` en cada arranque.
Las fotos ahora se guardan en la base (`producto_foto`, BYTEA, máx. 3 MB) y no en disco, así no se pierden al redesplegar.
El diagrama ER y el respaldo entregados corresponden a las 33 tablas; si se entrega esta versión, hay que regenerarlos.

## Fase 2: operación diaria del negocio (extensión 05, 42 tablas)
`celulares_api/db/05_caja_cobros_bitacora.sql` (idempotente, la aplica `init-db`) agrega 5 tablas y 1 vista:
`bitacora`, `caja`, `movimiento_caja`, `cuenta_cobrar`, `abono_cuenta` y `v_cuenta_saldo`.

| Función | Dónde | Quién |
|---|---|---|
| **Caja diaria**: abrir con monto inicial, ingresos/egresos manuales, cerrar contando el efectivo; el sistema calcula el esperado (inicial + efectivo cobrado + ingresos − egresos) y la diferencia | Panel → Caja | Vendedor, Admin |
| **Ventas a crédito**: casilla "Venta a crédito" con adelanto y fecha límite; crea la cuenta por cobrar | Nueva venta | Vendedor, Admin |
| **Cuentas por cobrar**: saldo por cliente, abonos con método de pago, recordatorio por WhatsApp; los abonos entran a la caja de quien cobra | Panel → Por cobrar | Vendedor, Admin |
| **Reportes por fechas**: vendido, costo, utilidad y margen; por vendedor, producto, marca, método y día; exporta CSV / imprime | Panel → Reportes | Admin |
| **Reposición**: productos bajo el mínimo agrupados por su último proveedor, con cantidad sugerida (doble del mínimo) | Panel → Reposición | Admin, Almacenero |
| **Bitácora**: quién anuló una venta (con motivo), cambió un precio, abrió/cerró caja, cobró un abono o cambió un pedido | Panel → Bitácora | Admin |
| **Pedido → venta**: botón "Registrar venta" en el pedido lleva a Nueva venta con los datos del pedido a la vista | Pedidos | Vendedor, Admin |

Notas: la utilidad usa el costo de compra *actual* del producto; las ventas a crédito cuentan como vendidas al registrarse y como cobro de caja
solo por lo realmente pagado (adelanto y abonos). Las pruebas automáticas (`npm test`) llegan a 108 comprobaciones.

## Fase 3: servicio al cliente (sin tablas nuevas)
- **Reparaciones desde el panel**: el técnico (o el administrador) abre «Gestionar», cambia el estado, el diagnóstico y la mano de obra. Al pasar a **Listo** aparece el botón **Avisar por WhatsApp**, con el mensaje ya escrito (modelo, N° de orden y total a pagar) hacia el teléfono del cliente. Cada cambio de estado queda en la bitácora.
- **Garantía pública** (`/garantia`): el cliente escribe el IMEI y ve modelo y vigencia; no se muestra ningún dato personal. Tiene límite de consultas por IP.
- **Garantía en el panel** (`Garantías`): por IMEI muestra a quién se vendió, cuándo, estado de la garantía y reparaciones previas. Para administrador, vendedor y técnico.
- **Resumen del administrador**: se agregan «Por cobrar» y «Cajas abiertas».
Pruebas automáticas: 123 comprobaciones.
