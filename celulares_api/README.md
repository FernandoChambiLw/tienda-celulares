# API · Sistema de celulares (Node.js + Express + PostgreSQL)

## Puesta en marcha
1. Cargar la BD desde `db/` (en este orden): `01_esquema.sql`, `02_vistas_triggers.sql`, `03_datos_prueba.sql`.
2. `cp .env.example .env` y completar `DATABASE_URL` y `JWT_SECRET` (mín. 24 caracteres).
3. `npm install` · `npm start` (puerto 3000) · `npm test` (prueba de humo, 51 comprobaciones).

Usuarios de prueba: `admin / Admin123!` (Administrador) · `lucia`, `marco`, `rosa` / `Clave123!` (Vendedor, Técnico, Almacenero).
Todas las rutas (salvo `/api/auth/login`, `/api/publico/*`, `/api/salud`) requieren `Authorization: Bearer <token>`.

## Endpoints
| Módulo | Rutas | Roles |
|---|---|---|
| Auth | POST `/auth/login`, GET `/auth/me`, POST `/auth/cambiar-clave` | todos |
| Usuarios | GET/POST/PATCH `/usuarios` | Administrador |
| Catálogos | GET `/catalogos/{marcas,categorias,metodos-pago,almacenes,sucursales,ciudades,empleados,tecnicos}` | todos |
| Clientes | CRUD `/clientes`, GET `/clientes/:id/ventas` | Vendedor/Técnico (borrar: admin) |
| Productos | CRUD `/productos`, POST `/productos/:id/foto` | Almacenero (lectura: todos; costo solo Admin/Almacenero) |
| Proveedores | CRUD `/proveedores` | Almacenero |
| Inventario | GET `/inventario`, `/alertas`, `/conciliacion`, `/unidades`, `/movimientos`; POST `/movimientos`; PATCH `/unidades/:id/baja`; PUT `/config` | Almacenero |
| Compras | GET/POST `/compras` (celulares con lista de IMEI) | Almacenero |
| Ventas | GET/POST `/ventas`, PATCH `/ventas/:id/anular` | Vendedor (anular: admin) |
| Reparaciones | GET/POST `/reparaciones`, PATCH `/:id`, POST/DELETE `/:id/repuestos`, CRUD `/reparaciones/repuestos` | Técnico/Vendedor |
| Reportes | GET `/reportes/resumen`, `/reportes/ganancia` | Administrador |
| Público | GET `/publico/catalogo`, `/publico/catalogo/:id`, `/publico/filtros` | sin login |

## Reglas que garantiza el sistema
- El stock solo cambia con movimientos (trigger); nunca queda negativo.
- Cada celular se vende por IMEI; un IMEI no se vende dos veces ni se asigna a otro producto.
- Ventas, compras y anulaciones son transacciones: si algo falla no queda nada a medias.
- Garantía automática al vender; una reparación de un equipo con garantía vigente se cobra 0.
