# Sacar FX TECHNOLOGY a producción

Hay dos formas de arrancar. **Demo** (la actual: datos de ejemplo, claves públicas) sirve para mostrar el proyecto.
**Producción** arranca vacío y seguro. Esta guía es para el segundo caso.

## 1. Qué cambia en modo producción (`DATOS_DEMO=no`)
- La base se crea **sin** clientes, productos, ventas ni usuarios de ejemplo. Quedan solo los catálogos (países, ciudades, cargos, marcas, categorías, métodos de pago), **una** sucursal, **un** almacén y el usuario `admin`.
- La clave del `admin` es la variable `ADMIN_PASSWORD` (en `render.neon.yaml` Render la genera sola; la ves en Render → Environment). Al primer ingreso el sistema **obliga a cambiarla**.
- Cada usuario que crees desde **Personal** también entra con clave temporal y debe cambiarla.
- Si desactivas a un empleado o cambias su rol, el efecto es **inmediato** (no espera a que venza su sesión).
- Solo se aplica cuando la base está vacía: nunca borra datos de una base que ya funciona.

## 2. Puesta en marcha paso a paso
1. Crea la base en Neon (ver `MIGRAR_A_NEON.md`, pasos 2 y 4). **No restaures** el respaldo de la demo: quieres empezar limpio.
2. Despliega con `render.neon.yaml` renombrado como `render.yaml`. En Render → Environment, pega `DATABASE_URL` de Neon.
3. Entra a `TU_URL/panel` con `admin` y la clave de `ADMIN_PASSWORD`. Cámbiala.
4. **Datos del negocio** (en este orden):
   1. *Personal* → crea a tus empleados y dales acceso (vendedor, técnico, almacenero).
   2. *Proveedores* → registra a quienes te venden.
   3. *Productos* → crea tus productos con precio de compra y de venta, y sube su foto.
   4. *Compras* → registra la primera compra a cada proveedor: **así entra el stock** (los celulares con su IMEI).
   5. Edita `tienda-celulares-web/src/config/site.js` (dirección, horario, correo) y vuelve a publicar.
5. **Prueba de humo antes de abrir:** haz una venta de prueba con un accesorio barato, un pedido desde la tienda pública, abre y cierra caja, descarga un respaldo. Luego anula la venta de prueba (queda en la bitácora).

## 3. Rutina diaria
| Cuándo | Quién | Qué |
|---|---|---|
| Al abrir | Vendedor | *Caja* → abrir con el efectivo inicial |
| Durante el día | Vendedor | Ventas, pedidos nuevos (la tienda reserva stock al pedir), cobros de créditos |
| Cuando llega mercadería | Almacenero | *Compras* |
| Al cerrar | Vendedor | *Caja* → cerrar contando el efectivo |
| Cada semana | Administrador | *Respaldo* → descargar y guardar **fuera** del sistema |

## 4. Seguridad: lista de comprobación
- [ ] `JWT_SECRET` largo y aleatorio (Render lo genera; no lo cambies después o se cierran las sesiones).
- [ ] Clave inicial del `admin` cambiada. Ningún usuario de ejemplo existe (`/api/auth/login` con `lucia / Clave123!` debe fallar).
- [ ] Sitio con `https://` (Render lo da por defecto).
- [ ] Respaldo descargado y guardado en dos lugares.
- [ ] Cada empleado tiene **su** usuario; no se comparten claves.
- [ ] Dueño y administrador de confianza: el rol Administrador puede anular ventas, ver costos y descargar toda la base.

## 5. Límites conocidos (para saberlos antes de abrir)
- **Factura**: el comprobante del sistema es interno. Si el negocio debe emitir factura del SIN, hay que integrarlo con un proveedor autorizado.
- **Plan gratis de Render**: el servicio «se duerme» tras 15 min sin visitas y la primera carga tarda ~1 minuto. Para atender clientes de verdad, usa el plan de pago más barato.
- **Fotos**: se guardan en la base (máx. 3 MB cada una); con cientos de productos conviene un servicio de imágenes aparte.
- **Un solo almacén y sucursal** en la interfaz.
- **Los pedidos reservan stock** mientras están Nuevo/Confirmado: al registrar la venta de un pedido, márcalo como *Entregado*.
