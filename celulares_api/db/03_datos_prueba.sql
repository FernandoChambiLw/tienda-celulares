-- =====================================================================
-- Datos de prueba · Empresa de celulares (v2)
-- Ejecutar DESPUÉS de 01_esquema.sql y 02_vistas_triggers.sql
-- Los ID se asumen de un esquema recién creado (identidades desde 1).
-- Contraseñas de prueba: admin -> Admin123!   (resto -> Clave123!)
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- para crypt()/gen_salt('bf'), compatible con bcrypt
SET search_path TO celulares, public;

-- ---------- Ubicación ----------
INSERT INTO pais (nombre) VALUES
 ('Bolivia'), ('China'), ('Estados Unidos'), ('Corea del Sur');

INSERT INTO departamento (nombre, id_pais) VALUES
 ('La Paz', 1), ('Cochabamba', 1), ('Santa Cruz', 1), ('Guangdong', 2);

INSERT INTO ciudad (nombre, id_departamento) VALUES
 ('La Paz', 1), ('El Alto', 1), ('Viacha', 1),
 ('Cochabamba', 2), ('Santa Cruz de la Sierra', 3), ('Shenzhen', 4);

-- ---------- Cargos, sucursales y empleados ----------
INSERT INTO cargo (nombre_cargo, descripcion, salario_base, nivel, area) VALUES
 ('Gerente General',        'Dirige la empresa',                 6000, 'Directivo',    'Administración'),
 ('Vendedor',               'Atención y venta en mostrador',     2800, 'Operativo',    'Ventas'),
 ('Técnico en reparaciones','Diagnóstico y reparación de equipos',3200, 'Operativo',    'Taller'),
 ('Almacenero',             'Control de inventario y recepción', 2600, 'Operativo',    'Almacén');

INSERT INTO sucursal (nombre, direccion, id_ciudad, telefono, correo, horario_atencion, fecha_apertura) VALUES
 ('Sucursal Central El Alto', 'Av. 6 de Marzo #1234',     2, '2-2812345', 'central@celulares.bo', 'Lun-Sáb 9:00-20:00', '2022-03-01'),
 ('Sucursal Viacha',          'Calle Bolívar #45, Plaza', 3, '2-8123456', 'viacha@celulares.bo',  'Lun-Sáb 9:00-19:00', '2024-06-15');

INSERT INTO empleado (nombres, apellido_paterno, apellido_materno, ci, fecha_nacimiento, telefono, correo, direccion, fecha_ingreso, salario, id_cargo, id_sucursal) VALUES
 ('Carlos', 'Mamani', 'Quispe',  '4567891', '1985-04-12', '70112233', 'carlos@celulares.bo', 'El Alto',  '2022-03-01', 6000, 1, 1),
 ('Lucía',  'Condori','Flores',  '5678912', '1995-08-30', '71223344', 'lucia@celulares.bo',  'El Alto',  '2022-05-10', 2800, 2, 1),
 ('Marco',  'Apaza',  'Choque',  '6789123', '1992-01-20', '72334455', 'marco@celulares.bo',  'La Paz',   '2023-01-15', 3200, 3, 1),
 ('Rosa',   'Huanca', 'Tarqui',  '7891234', '1990-11-05', '73445566', 'rosa@celulares.bo',   'El Alto',  '2022-03-01', 2600, 4, 1),
 ('Jorge',  'Nina',   'Mamani',  '8912345', '1998-06-18', '74556677', 'jorge@celulares.bo',  'Viacha',   '2024-06-15', 2800, 2, 2);

UPDATE sucursal SET id_empleado_encargado = 1 WHERE id_sucursal = 1;
UPDATE sucursal SET id_empleado_encargado = 5 WHERE id_sucursal = 2;

INSERT INTO usuario (username, password_hash, rol, id_empleado) VALUES
 ('admin', crypt('Admin123!', gen_salt('bf')), 'Administrador', 1),
 ('lucia', crypt('Clave123!', gen_salt('bf')), 'Vendedor',      2),
 ('marco', crypt('Clave123!', gen_salt('bf')), 'Tecnico',       3),
 ('rosa',  crypt('Clave123!', gen_salt('bf')), 'Almacenero',    4);

INSERT INTO almacen (nombre, direccion, capacidad_maxima, telefono, id_sucursal, id_empleado_responsable) VALUES
 ('Almacén Central', 'Av. 6 de Marzo #1234 (piso 2)', 500, '2-2812345', 1, 4),
 ('Almacén Viacha',  'Calle Bolívar #45 (depósito)',  150, '2-8123456', 2, 5);

-- ---------- Catálogo ----------
INSERT INTO categoria (nombre, descripcion) VALUES
 ('Celulares',               'Teléfonos móviles'),
 ('Fundas y protectores',    'Fundas, cases y bumpers'),
 ('Cargadores y cables',     'Carga y datos'),
 ('Audífonos',               'Auriculares y manos libres'),
 ('Smartwatch y pulseras',   'Dispositivos vestibles'),
 ('Protectores de pantalla', 'Vidrio templado y films');

INSERT INTO marca (nombre, id_pais, sitio_web, anio_fundacion) VALUES
 ('Samsung',  4, 'https://www.samsung.com',  1938),
 ('Apple',    3, 'https://www.apple.com',    1976),
 ('Xiaomi',   2, 'https://www.mi.com',       2010),
 ('Motorola', 3, 'https://www.motorola.com', 1928),
 ('Anker',    2, 'https://www.anker.com',    2011),
 ('JBL',      3, 'https://www.jbl.com',      1946),
 ('Genérica', 2, NULL,                       NULL);

INSERT INTO producto (codigo, nombre, descripcion, tipo_producto, precio_compra, precio_venta, garantia_meses, id_marca, id_categoria) VALUES
 ('CEL-SAM-A15',  'Samsung Galaxy A15 128GB',     'Pantalla AMOLED 6.5", 4GB RAM',            'Celular',     1200, 1550, 12, 1, 1),
 ('CEL-XIA-RN13', 'Xiaomi Redmi Note 13 256GB',   'AMOLED 120Hz, cámara 108MP',               'Celular',     1500, 1900, 12, 3, 1),
 ('CEL-MOT-G54',  'Motorola Moto G54 5G 128GB',   '5G, batería 6000 mAh',                     'Celular',     1300, 1650, 12, 4, 1),
 ('CEL-APP-I13',  'iPhone 13 128GB',              'Chip A15 Bionic',                          'Celular',     4200, 5100, 12, 2, 1),
 ('ACC-FUN-A15',  'Funda silicona Galaxy A15',    'Funda de silicona flexible',               'Accesorio',     15,   45,  1, 7, 2),
 ('ACC-CAR-ANK',  'Cargador Anker 20W USB-C',     'Carga rápida PD 20W',                      'Accesorio',     60,  110,  6, 5, 3),
 ('ACC-AUD-JBL',  'Audífonos JBL Tune 510BT',     'Bluetooth, 40h de batería',                'Accesorio',    180,  290, 12, 6, 4),
 ('ACC-VID-UNI',  'Vidrio templado 9H universal', 'Protector de pantalla',                    'Accesorio',      3,   20,  0, 7, 6),
 ('DIS-BAN-XIA',  'Xiaomi Smart Band 8',          'Pulsera de actividad AMOLED',              'Dispositivo',  160,  260, 12, 3, 5),
 ('DIS-FIT-SAM',  'Samsung Galaxy Fit3',          'Pulsera de actividad',                     'Dispositivo',  220,  340, 12, 1, 5);

INSERT INTO celular (id_producto, modelo, ram_gb, almacenamiento_gb, sistema_operativo, version_so, tamanio_pantalla, resolucion, camara_principal_mp, camara_frontal_mp, bateria_mah, procesador, color, red, dual_sim) VALUES
 (1, 'Galaxy A15',   4, 128, 'Android', '14', 6.5, '2340x1080', 50.0, 13.0, 5000, 'Helio G99',        'Negro',  '4G', TRUE),
 (2, 'Redmi Note 13',8, 256, 'Android', '13', 6.6, '2400x1080',108.0, 16.0, 5000, 'Snapdragon 685',   'Azul',   '4G', TRUE),
 (3, 'Moto G54',     8, 128, 'Android', '13', 6.5, '2400x1080', 50.0, 16.0, 6000, 'Dimensity 7020',   'Azul',   '5G', TRUE),
 (4, 'iPhone 13',    4, 128, 'iOS',     '17', 6.1, '2532x1170', 12.0, 12.0, 3240, 'A15 Bionic',       'Medianoche','5G', FALSE);

INSERT INTO accesorio (id_producto, tipo_accesorio, compatibilidad, material, color, conectividad, potencia_w) VALUES
 (5, 'Funda',            'Samsung Galaxy A15', 'Silicona', 'Negro',   NULL,        NULL),
 (6, 'Cargador',         'USB-C universal',    'Plástico', 'Blanco',  'USB-C',     20.0),
 (7, 'Audífonos',        'Universal',          'Plástico', 'Negro',   'Bluetooth', NULL),
 (8, 'Protector pantalla','Universal 6.5"',    'Vidrio',   'Transparente', NULL,    NULL);

INSERT INTO dispositivo_complementario (id_producto, tipo_dispositivo, modelo, conectividad, autonomia_horas, resistencia_agua, color) VALUES
 (9,  'Pulsera inteligente', 'Smart Band 8', 'Bluetooth 5.1', 336, '5 ATM', 'Negro'),
 (10, 'Pulsera inteligente', 'Galaxy Fit3',  'Bluetooth 5.3', 312, '5 ATM', 'Gris');

-- ---------- Clientes ----------
INSERT INTO cliente (nombres, apellido_paterno, apellido_materno, ci, fecha_nacimiento, sexo, correo, direccion, tipo_cliente, nit, razon_social) VALUES
 ('Juan',    'Pérez',  'Mamani',  '8456123', '1999-02-14', 'M', 'juan.perez@mail.com',  'Zona Ceja, El Alto',   'Natural',  NULL, NULL),
 ('María',   'Quispe', 'Condori', '9123456', '1994-07-22', 'F', 'maria.quispe@mail.com','Villa Adela, El Alto',  'Natural',  NULL, NULL),
 ('Pedro',   'Flores', 'Huanca',  '7654321', '1988-12-03', 'M', 'pedro.flores@mail.com','Viacha centro',        'Natural',  NULL, NULL),
 ('Ana',     'Choque', 'Vargas',  '6543210', '2001-05-30', 'F', NULL,                   'Achocalla',            'Natural',  NULL, NULL),
 ('Roberto', 'Salazar',NULL,      '5432109', '1980-09-09', 'M', 'compras@andina.com.bo','Av. Camacho #800, La Paz', 'Juridica','1023456022','Comercial Andina S.R.L.');

INSERT INTO telefono_cliente (numero, tipo, id_cliente) VALUES
 ('71111111', 'WhatsApp', 1), ('72222222', 'Celular', 2), ('73333333', 'Celular', 3),
 ('73333334', 'WhatsApp', 3), ('74444444', 'Celular', 4), ('2-2400000', 'Fijo', 5);

-- ---------- Proveedores y pagos ----------
INSERT INTO proveedor (razon_social, nit, nombre_contacto, telefono, correo, direccion, id_ciudad, tipo_proveedor) VALUES
 ('Tech Import Bolivia S.R.L.',      '1015566020', 'Daniel Rojas',  '2-2111222', 'ventas@techimport.bo', 'Av. Montes #500',      1, 'Celulares'),
 ('Shenzhen Mobile Parts Co.',       '9100000001', 'Li Wei',        '+86755000', 'sales@szparts.cn',     'Huaqiangbei Rd 12',    6, 'Repuestos'),
 ('Distribuidora Andina Accesorios', '1029988021', 'Sofía Mendoza', '3-3444555', 'info@dandina.bo',      'Calle Warnes #300',    5, 'Accesorios');

INSERT INTO metodo_pago (nombre, descripcion, comision) VALUES
 ('Efectivo',              'Pago en caja',                     0),
 ('Tarjeta de débito',     'POS bancario',                     1.50),
 ('Transferencia QR',      'QR interbancario',                 0.50),
 ('Transferencia bancaria','Depósito o transferencia',         0);

-- ---------- Compras (el stock sube por movimiento_inventario) ----------
INSERT INTO compra_proveedor (fecha_compra, numero_factura, estado, id_proveedor, id_empleado, id_metodo_pago) VALUES
 ('2026-09-20', 'F-0001', 'Recibida', 1, 4, 4),
 ('2026-09-25', 'F-0457', 'Recibida', 3, 4, 4);

INSERT INTO detalle_compra (id_compra, id_producto, cantidad, precio_unitario) VALUES
 (1, 1,  5, 1200), (1, 2,  3, 1500), (1, 3,  4, 1300), (1, 4,  2, 4200),
 (1, 5, 20,   15), (1, 6, 15,   60),
 (2, 7, 10,  180), (2, 8, 40,    3), (2, 9,  8,  160), (2, 10, 6,  220);

-- Unidades físicas (IMEI) de los celulares comprados
INSERT INTO unidad_celular (imei, numero_serie, id_producto, id_almacen, id_compra)
SELECT '3569' || lpad(v.p::text, 2, '0') || lpad(g::text, 9, '0'),
       'SN' || lpad(v.p::text, 2, '0') || lpad(g::text, 6, '0'),
       v.p, 1, 1
FROM (VALUES (1,5),(2,3),(3,4),(4,2)) AS v(p, n),
     LATERAL generate_series(1, v.n) AS g
ORDER BY v.p, g;

INSERT INTO movimiento_inventario (tipo_movimiento, cantidad, motivo, id_producto, id_almacen_destino, id_empleado, id_compra, fecha) VALUES
 ('Entrada',  5, 'Compra F-0001', 1, 1, 4, 1, '2026-09-20 10:00'),
 ('Entrada',  3, 'Compra F-0001', 2, 1, 4, 1, '2026-09-20 10:00'),
 ('Entrada',  4, 'Compra F-0001', 3, 1, 4, 1, '2026-09-20 10:00'),
 ('Entrada',  2, 'Compra F-0001', 4, 1, 4, 1, '2026-09-20 10:00'),
 ('Entrada', 20, 'Compra F-0001', 5, 1, 4, 1, '2026-09-20 10:00'),
 ('Entrada', 15, 'Compra F-0001', 6, 1, 4, 1, '2026-09-20 10:00'),
 ('Entrada', 10, 'Compra F-0457', 7, 1, 4, 2, '2026-09-25 11:00'),
 ('Entrada', 40, 'Compra F-0457', 8, 1, 4, 2, '2026-09-25 11:00'),
 ('Entrada',  8, 'Compra F-0457', 9, 1, 4, 2, '2026-09-25 11:00'),
 ('Entrada',  6, 'Compra F-0457',10, 1, 4, 2, '2026-09-25 11:00');

-- Traslado de 2 vidrios y 1 funda a la sucursal Viacha
INSERT INTO movimiento_inventario (tipo_movimiento, cantidad, motivo, id_producto, id_almacen_origen, id_almacen_destino, id_empleado, fecha) VALUES
 ('Traslado', 10, 'Reposición sucursal Viacha', 8, 1, 2, 4, '2026-10-01 09:00'),
 ('Traslado',  5, 'Reposición sucursal Viacha', 5, 1, 2, 4, '2026-10-01 09:00');

UPDATE inventario SET stock_minimo = 2,  stock_maximo = 10 WHERE id_producto IN (1,2,3,4);
UPDATE inventario SET stock_minimo = 5,  stock_maximo = 50 WHERE id_producto IN (5,6,7,8);
UPDATE inventario SET stock_minimo = 3,  stock_maximo = 15 WHERE id_producto IN (9,10);

-- ---------- Ventas ----------
INSERT INTO venta (fecha_hora, descuento, impuesto, estado, id_cliente, id_empleado, id_sucursal, id_metodo_pago) VALUES
 ('2026-10-05 10:30', 0,   0, 'Completada', 1, 2, 1, 1),
 ('2026-10-12 16:10', 0,   0, 'Completada', 2, 2, 1, 3),
 ('2026-10-20 11:00', 100, 0, 'Completada', 5, 2, 1, 4);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, descuento) VALUES
 (1, 1, 1, 1550, 0), (1, 5, 1,  45, 0),
 (2, 2, 1, 1900, 0), (2, 6, 1, 110, 0),
 (3, 3, 2, 1650, 0);

-- IMEI vendidos (el trigger marca cada unidad como 'Vendido')
INSERT INTO detalle_venta_unidad (id_unidad, id_venta, id_producto) VALUES
 (1, 1, 1), (6, 2, 2), (9, 3, 3), (10, 3, 3);

-- Salida de stock por las ventas
INSERT INTO movimiento_inventario (tipo_movimiento, cantidad, motivo, id_producto, id_almacen_origen, id_empleado, id_venta, fecha) VALUES
 ('Salida', 1, 'Venta #1', 1, 1, 2, 1, '2026-10-05 10:30'),
 ('Salida', 1, 'Venta #1', 5, 1, 2, 1, '2026-10-05 10:30'),
 ('Salida', 1, 'Venta #2', 2, 1, 2, 2, '2026-10-12 16:10'),
 ('Salida', 1, 'Venta #2', 6, 1, 2, 2, '2026-10-12 16:10'),
 ('Salida', 2, 'Venta #3', 3, 1, 2, 3, '2026-10-20 11:00');

INSERT INTO factura (numero_factura, nit_cliente, razon_social, fecha_emision, codigo_control, id_venta) VALUES
 ('FAC-000001', '8456123',    'Pérez Mamani',            '2026-10-05', 'A1-B2-C3-D4', 1),
 ('FAC-000002', '1023456022', 'Comercial Andina S.R.L.', '2026-10-20', 'E5-F6-G7-H8', 3);

INSERT INTO garantia (fecha_inicio, meses, tipo_garantia, condiciones, id_venta, id_producto, id_unidad) VALUES
 ('2026-10-05', 12, 'Fabricante', 'No cubre golpes ni humedad', 1, 1, 1),
 ('2026-10-12', 12, 'Fabricante', 'No cubre golpes ni humedad', 2, 2, 6),
 ('2026-10-20', 12, 'Fabricante', 'No cubre golpes ni humedad', 3, 3, 9),
 ('2026-10-20', 12, 'Fabricante', 'No cubre golpes ni humedad', 3, 3, 10);

INSERT INTO promocion (nombre, descripcion, porcentaje_descuento, fecha_inicio, fecha_fin, id_producto) VALUES
 ('Black Friday audífonos', '10% en JBL Tune 510BT', 10, '2026-11-20', '2026-11-30', 7);

-- ---------- Posventa ----------
INSERT INTO repuesto (nombre, descripcion, precio, stock, compatibilidad, id_proveedor) VALUES
 ('Pantalla Redmi 12',       'Display completo con marco', 85, 5,  'Xiaomi Redmi 12',    2),
 ('Batería Galaxy A15',      '5000 mAh original',          55, 8,  'Samsung Galaxy A15',  2),
 ('Conector de carga USB-C', 'Placa de carga',             12, 20, 'USB-C universal',     2);

INSERT INTO equipo_externo (imei, modelo, color, id_marca, id_cliente) VALUES
 ('352099001234567', 'Redmi 12', 'Gris', 3, 3);

-- Reparación 1: equipo externo, con costo
INSERT INTO reparacion (fecha_ingreso, fecha_entrega_estimada, falla_reportada, diagnostico, costo_mano_obra, estado, id_cliente, id_equipo, id_empleado_tecnico) VALUES
 ('2026-10-25', '2026-10-28', 'Pantalla rota tras caída', 'Cambio de display completo', 80, 'Listo', 3, 1, 3);
-- Reparación 2: unidad vendida por la tienda, cubierta por garantía
INSERT INTO reparacion (fecha_ingreso, fecha_entrega_estimada, falla_reportada, diagnostico, costo_mano_obra, estado, id_cliente, id_unidad, id_garantia, id_empleado_tecnico) VALUES
 ('2026-11-03', '2026-11-06', 'No carga el equipo', 'Conector de carga dañado', 0, 'En reparacion', 1, 1, 1, 3);

INSERT INTO detalle_reparacion (id_reparacion, id_repuesto, cantidad, precio_unitario) VALUES
 (1, 1, 1, 85),
 (2, 3, 1, 12);
