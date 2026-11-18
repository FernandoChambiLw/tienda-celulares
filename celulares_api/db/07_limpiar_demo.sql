-- Deja la base lista para un NEGOCIO REAL: conserva solo catálogos (países, ciudades, cargos, marcas,
-- categorías, métodos de pago), UNA sucursal, UN almacén y el usuario administrador. Borra todo lo de ejemplo.
-- Solo se ejecuta la primera vez, cuando DATOS_DEMO=no.
SET search_path TO celulares;

TRUNCATE producto, cliente, proveedor, repuesto, equipo_externo, promocion, venta, compra_proveedor,
         caja, bitacora, pedido RESTART IDENTITY CASCADE;

UPDATE sucursal SET id_empleado_encargado = NULL;
UPDATE almacen SET id_empleado_responsable = NULL;
DELETE FROM usuario WHERE id_empleado <> 1;
DELETE FROM almacen WHERE id_sucursal <> 1;
DELETE FROM empleado WHERE id_empleado <> 1;
DELETE FROM sucursal WHERE id_sucursal <> 1;

UPDATE empleado SET nombres = 'Administrador', apellido_paterno = 'FX', apellido_materno = NULL, ci = '0000000',
       fecha_nacimiento = NULL, telefono = NULL, correo = NULL, direccion = NULL, salario = 0 WHERE id_empleado = 1;
UPDATE sucursal SET nombre = 'FX TECHNOLOGY', direccion = 'Por definir', telefono = NULL, correo = NULL, id_empleado_encargado = 1 WHERE id_sucursal = 1;
UPDATE almacen SET nombre = 'Almacén principal', direccion = NULL, id_empleado_responsable = 1 WHERE id_sucursal = 1;
