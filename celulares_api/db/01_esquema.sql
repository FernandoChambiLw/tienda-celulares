-- =====================================================================
-- Base de Datos I - Empresa de celulares y tecnología móvil   (v2)
-- Modelo relacional en 3FN · 33 tablas · PostgreSQL 12+
-- =====================================================================
-- Orden de ejecución (psql):
--   CREATE DATABASE empresa_celulares;
--   \c empresa_celulares
--   \i 01_esquema.sql
--   \i 02_vistas_triggers.sql
--   \i 03_datos_prueba.sql        (opcional)
--
-- CAMBIOS RESPECTO A LA v1
--  Funcionales
--   + usuario                  : login para web y app (rol por empleado)
--   + detalle_venta_unidad     : liga cada venta con el IMEI vendido
--   + equipo_externo           : reparaciones de equipos no comprados aquí
--   ~ movimiento_inventario    : almacén origen/destino (traslados reales)
--   ~ producto.foto_url        : imagen para web y app
--  Normalización (3FN)
--   + pais / departamento / ciudad (antes texto repetido en sucursal,
--     proveedor y marca: ciudad -> departamento era dependencia transitiva)
--   ~ almacen.responsable      : texto libre -> FK a empleado
--   ~ compra_proveedor.metodo_pago : texto libre -> FK a metodo_pago
--   - Se eliminan columnas derivadas guardadas (totales de venta, compra,
--     reparación y factura). Ahora son columnas GENERATED o vistas.
--   ~ stock: inventario se actualiza SOLO por movimiento_inventario
--     (trigger en 02_vistas_triggers.sql); una única fuente de verdad.
--  Integridad
--   ~ CHECK en todos los campos de estado / tipo / red
--   ~ producto.tipo_producto + FK compuesta: un producto no puede ser a la
--     vez celular y accesorio
--   ~ unidad_celular apunta a celular (no a cualquier producto) y a la compra
--   ~ venta.fecha_venta + hora_venta -> fecha_hora TIMESTAMP
-- =====================================================================

DROP SCHEMA IF EXISTS celulares CASCADE;
CREATE SCHEMA celulares;
SET search_path TO celulares;

-- =====================================================================
-- 0. UBICACIÓN GEOGRÁFICA
-- =====================================================================

CREATE TABLE pais (
    id_pais  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre   VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE departamento (
    id_departamento  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           VARCHAR(60) NOT NULL,
    id_pais          INT NOT NULL REFERENCES pais(id_pais)
                         ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE (nombre, id_pais)
);

CREATE TABLE ciudad (
    id_ciudad        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           VARCHAR(60) NOT NULL,
    id_departamento  INT NOT NULL REFERENCES departamento(id_departamento)
                         ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE (nombre, id_departamento)
);

-- =====================================================================
-- 1. PERSONAS
-- =====================================================================

CREATE TABLE cliente (
    id_cliente        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombres           VARCHAR(80)  NOT NULL,
    apellido_paterno  VARCHAR(50)  NOT NULL,
    apellido_materno  VARCHAR(50),
    ci                VARCHAR(20)  NOT NULL UNIQUE,
    fecha_nacimiento  DATE,
    sexo              CHAR(1)      CHECK (sexo IN ('M','F')),
    correo            VARCHAR(100) UNIQUE,
    direccion         VARCHAR(150),
    fecha_registro    DATE         NOT NULL DEFAULT CURRENT_DATE,
    tipo_cliente      VARCHAR(20)  NOT NULL DEFAULT 'Natural'
                          CHECK (tipo_cliente IN ('Natural','Juridica')),
    nit               VARCHAR(20),
    razon_social      VARCHAR(100),
    estado            VARCHAR(15)  NOT NULL DEFAULT 'Activo'
                          CHECK (estado IN ('Activo','Inactivo')),
    -- un cliente jurídico necesita NIT y razón social
    CHECK (tipo_cliente = 'Natural' OR (nit IS NOT NULL AND razon_social IS NOT NULL))
);

CREATE TABLE telefono_cliente (
    id_telefono  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero       VARCHAR(20) NOT NULL,
    tipo         VARCHAR(20) NOT NULL DEFAULT 'Celular'
                     CHECK (tipo IN ('Celular','Fijo','WhatsApp')),
    id_cliente   INT NOT NULL REFERENCES cliente(id_cliente)
                     ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE cargo (
    id_cargo      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_cargo  VARCHAR(60)  NOT NULL UNIQUE,
    descripcion   VARCHAR(200),
    salario_base  NUMERIC(10,2) NOT NULL CHECK (salario_base >= 0),
    nivel         VARCHAR(20),
    area          VARCHAR(50)
);

-- =====================================================================
-- 2. ESTRUCTURA
-- =====================================================================

-- SUCURSAL se crea SIN la FK al encargado (dependencia circular con
-- EMPLEADO); esa FK se agrega con ALTER TABLE después de crear EMPLEADO.
CREATE TABLE sucursal (
    id_sucursal             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre                  VARCHAR(80)  NOT NULL,
    direccion               VARCHAR(150) NOT NULL,
    id_ciudad               INT NOT NULL REFERENCES ciudad(id_ciudad)
                                ON UPDATE CASCADE ON DELETE RESTRICT,
    telefono                VARCHAR(20),
    correo                  VARCHAR(100),
    horario_atencion        VARCHAR(100),
    fecha_apertura          DATE,
    estado                  VARCHAR(15) NOT NULL DEFAULT 'Activo'
                                CHECK (estado IN ('Activo','Inactivo')),
    id_empleado_encargado   INT UNIQUE            -- 0..1 sucursal por encargado
);

CREATE TABLE empleado (
    id_empleado       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombres           VARCHAR(80)  NOT NULL,
    apellido_paterno  VARCHAR(50)  NOT NULL,
    apellido_materno  VARCHAR(50),
    ci                VARCHAR(20)  NOT NULL UNIQUE,
    fecha_nacimiento  DATE,
    telefono          VARCHAR(20),
    correo            VARCHAR(100) UNIQUE,
    direccion         VARCHAR(150),
    fecha_ingreso     DATE         NOT NULL DEFAULT CURRENT_DATE,
    salario           NUMERIC(10,2) NOT NULL CHECK (salario >= 0),
    estado            VARCHAR(15)  NOT NULL DEFAULT 'Activo'
                          CHECK (estado IN ('Activo','Inactivo','Suspendido')),
    id_cargo          INT NOT NULL REFERENCES cargo(id_cargo)
                          ON UPDATE CASCADE ON DELETE RESTRICT,
    id_sucursal       INT NOT NULL REFERENCES sucursal(id_sucursal)
                          ON UPDATE CASCADE ON DELETE RESTRICT
);

ALTER TABLE sucursal
    ADD CONSTRAINT fk_sucursal_encargado
    FOREIGN KEY (id_empleado_encargado) REFERENCES empleado(id_empleado)
    ON UPDATE CASCADE ON DELETE SET NULL;

-- Acceso al sistema (web y app). El hash lo genera el backend (bcrypt).
CREATE TABLE usuario (
    id_usuario     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username       VARCHAR(40)  NOT NULL UNIQUE,
    password_hash  VARCHAR(100) NOT NULL,
    rol            VARCHAR(20)  NOT NULL
                       CHECK (rol IN ('Administrador','Vendedor','Tecnico','Almacenero')),
    estado         VARCHAR(15)  NOT NULL DEFAULT 'Activo'
                       CHECK (estado IN ('Activo','Inactivo','Bloqueado')),
    ultimo_acceso  TIMESTAMP,
    id_empleado    INT NOT NULL UNIQUE REFERENCES empleado(id_empleado)
                       ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE almacen (
    id_almacen              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre                  VARCHAR(80)  NOT NULL,
    direccion               VARCHAR(150),
    capacidad_maxima        INT CHECK (capacidad_maxima > 0),
    telefono                VARCHAR(20),
    estado                  VARCHAR(15) NOT NULL DEFAULT 'Activo'
                                CHECK (estado IN ('Activo','Inactivo')),
    id_sucursal             INT NOT NULL REFERENCES sucursal(id_sucursal)
                                ON UPDATE CASCADE ON DELETE RESTRICT,
    id_empleado_responsable INT REFERENCES empleado(id_empleado)
                                ON UPDATE CASCADE ON DELETE SET NULL
);

-- =====================================================================
-- 3. CATÁLOGO
-- =====================================================================

CREATE TABLE categoria (
    id_categoria  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre        VARCHAR(60) NOT NULL UNIQUE,
    descripcion   VARCHAR(200),
    estado        VARCHAR(15) NOT NULL DEFAULT 'Activo'
                      CHECK (estado IN ('Activo','Inactivo'))
);

CREATE TABLE marca (
    id_marca       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(60) NOT NULL UNIQUE,
    id_pais        INT REFERENCES pais(id_pais)
                       ON UPDATE CASCADE ON DELETE SET NULL,
    sitio_web      VARCHAR(120),
    anio_fundacion SMALLINT,
    descripcion    VARCHAR(200)
);

CREATE TABLE producto (
    id_producto    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo         VARCHAR(30)  NOT NULL UNIQUE,
    nombre         VARCHAR(100) NOT NULL,
    descripcion    VARCHAR(300),
    tipo_producto  VARCHAR(20)  NOT NULL
                       CHECK (tipo_producto IN ('Celular','Accesorio','Dispositivo')),
    precio_compra  NUMERIC(10,2) NOT NULL CHECK (precio_compra >= 0),
    precio_venta   NUMERIC(10,2) NOT NULL CHECK (precio_venta  >= 0),
    fecha_ingreso  DATE         NOT NULL DEFAULT CURRENT_DATE,
    garantia_meses SMALLINT     NOT NULL DEFAULT 0 CHECK (garantia_meses >= 0),
    foto_url       VARCHAR(255),
    estado         VARCHAR(15)  NOT NULL DEFAULT 'Activo'
                       CHECK (estado IN ('Activo','Inactivo','Descontinuado')),
    id_marca       INT NOT NULL REFERENCES marca(id_marca)
                       ON UPDATE CASCADE ON DELETE RESTRICT,
    id_categoria   INT NOT NULL REFERENCES categoria(id_categoria)
                       ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE (id_producto, tipo_producto)      -- soporte de las FK compuestas
);

-- Especializaciones de PRODUCTO (PK = FK, 0..1). La FK compuesta
-- (id_producto, tipo_producto) impide que un producto sea de dos tipos.
CREATE TABLE celular (
    id_producto         INT PRIMARY KEY,
    tipo_producto       VARCHAR(20) NOT NULL DEFAULT 'Celular'
                            CHECK (tipo_producto = 'Celular'),
    modelo              VARCHAR(60) NOT NULL,
    ram_gb              SMALLINT,
    almacenamiento_gb   INT,
    sistema_operativo   VARCHAR(30),
    version_so          VARCHAR(20),
    tamanio_pantalla    NUMERIC(3,1),
    resolucion          VARCHAR(20),
    camara_principal_mp NUMERIC(5,1),
    camara_frontal_mp   NUMERIC(5,1),
    bateria_mah         INT,
    procesador          VARCHAR(60),
    color               VARCHAR(30),
    red                 VARCHAR(10) CHECK (red IN ('2G','3G','4G','5G')),
    dual_sim            BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (id_producto, tipo_producto)
        REFERENCES producto(id_producto, tipo_producto)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE accesorio (
    id_producto     INT PRIMARY KEY,
    tipo_producto   VARCHAR(20) NOT NULL DEFAULT 'Accesorio'
                        CHECK (tipo_producto = 'Accesorio'),
    tipo_accesorio  VARCHAR(40) NOT NULL,
    compatibilidad  VARCHAR(100),
    material        VARCHAR(40),
    color           VARCHAR(30),
    peso_gramos     NUMERIC(8,2),
    conectividad    VARCHAR(40),
    potencia_w      NUMERIC(6,1),
    FOREIGN KEY (id_producto, tipo_producto)
        REFERENCES producto(id_producto, tipo_producto)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE dispositivo_complementario (
    id_producto      INT PRIMARY KEY,
    tipo_producto    VARCHAR(20) NOT NULL DEFAULT 'Dispositivo'
                         CHECK (tipo_producto = 'Dispositivo'),
    tipo_dispositivo VARCHAR(40) NOT NULL,
    modelo           VARCHAR(60),
    conectividad     VARCHAR(40),
    autonomia_horas  NUMERIC(5,1),
    resistencia_agua VARCHAR(30),
    color            VARCHAR(30),
    peso_gramos      NUMERIC(8,2),
    FOREIGN KEY (id_producto, tipo_producto)
        REFERENCES producto(id_producto, tipo_producto)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- =====================================================================
-- 4. PROVEEDORES, PAGOS Y COMPRAS
-- =====================================================================

CREATE TABLE proveedor (
    id_proveedor     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    razon_social     VARCHAR(100) NOT NULL,
    nit              VARCHAR(20)  NOT NULL UNIQUE,
    nombre_contacto  VARCHAR(80),
    telefono         VARCHAR(20),
    correo           VARCHAR(100),
    direccion        VARCHAR(150),
    id_ciudad        INT REFERENCES ciudad(id_ciudad)
                         ON UPDATE CASCADE ON DELETE SET NULL,
    tipo_proveedor   VARCHAR(40),
    fecha_registro   DATE        NOT NULL DEFAULT CURRENT_DATE,
    estado           VARCHAR(15) NOT NULL DEFAULT 'Activo'
                         CHECK (estado IN ('Activo','Inactivo'))
);

CREATE TABLE metodo_pago (
    id_metodo_pago  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre          VARCHAR(40) NOT NULL UNIQUE,
    descripcion     VARCHAR(150),
    comision        NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (comision >= 0),
    estado          VARCHAR(15)  NOT NULL DEFAULT 'Activo'
                        CHECK (estado IN ('Activo','Inactivo'))
);

CREATE TABLE compra_proveedor (
    id_compra       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_compra    DATE NOT NULL DEFAULT CURRENT_DATE,
    numero_factura  VARCHAR(30),
    descuento       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    estado          VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
                        CHECK (estado IN ('Pendiente','Recibida','Anulada')),
    id_proveedor    INT NOT NULL REFERENCES proveedor(id_proveedor)
                        ON UPDATE CASCADE ON DELETE RESTRICT,
    id_empleado     INT NOT NULL REFERENCES empleado(id_empleado)
                        ON UPDATE CASCADE ON DELETE RESTRICT,
    id_metodo_pago  INT REFERENCES metodo_pago(id_metodo_pago)
                        ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE (id_proveedor, numero_factura)
);

CREATE TABLE detalle_compra (
    id_compra       INT NOT NULL REFERENCES compra_proveedor(id_compra)
                        ON UPDATE CASCADE ON DELETE CASCADE,
    id_producto     INT NOT NULL REFERENCES producto(id_producto)
                        ON UPDATE CASCADE ON DELETE RESTRICT,
    cantidad        INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    PRIMARY KEY (id_compra, id_producto)
);

-- =====================================================================
-- 5. INVENTARIO
-- =====================================================================

-- Cada IMEI es una unidad física; solo existe para productos tipo celular.
CREATE TABLE unidad_celular (
    id_unidad     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    imei          VARCHAR(20) NOT NULL UNIQUE,
    numero_serie  VARCHAR(40) UNIQUE,
    estado        VARCHAR(20) NOT NULL DEFAULT 'Disponible'
                      CHECK (estado IN ('Disponible','Reservado','Vendido','Baja')),
    fecha_ingreso DATE        NOT NULL DEFAULT CURRENT_DATE,
    id_producto   INT NOT NULL REFERENCES celular(id_producto)
                      ON UPDATE CASCADE ON DELETE RESTRICT,
    id_almacen    INT NOT NULL REFERENCES almacen(id_almacen)
                      ON UPDATE CASCADE ON DELETE RESTRICT,
    id_compra     INT REFERENCES compra_proveedor(id_compra)
                      ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE (id_unidad, id_producto)          -- soporte de FK compuestas
);

-- stock_actual lo mantiene el trigger de movimiento_inventario.
CREATE TABLE inventario (
    id_inventario              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stock_actual               INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo               INT NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    stock_maximo               INT CHECK (stock_maximo >= stock_minimo),
    ubicacion_estante          VARCHAR(30),
    fecha_ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_almacen                 INT NOT NULL REFERENCES almacen(id_almacen)
                                   ON UPDATE CASCADE ON DELETE RESTRICT,
    id_producto                INT NOT NULL REFERENCES producto(id_producto)
                                   ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE (id_almacen, id_producto)
);

-- =====================================================================
-- 6. VENTAS
-- =====================================================================

CREATE TABLE venta (
    id_venta        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_hora      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descuento       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    impuesto        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (impuesto  >= 0),
    estado          VARCHAR(20) NOT NULL DEFAULT 'Completada'
                        CHECK (estado IN ('Pendiente','Completada','Anulada')),
    id_cliente      INT NOT NULL REFERENCES cliente(id_cliente)
                        ON UPDATE CASCADE ON DELETE RESTRICT,
    id_empleado     INT NOT NULL REFERENCES empleado(id_empleado)
                        ON UPDATE CASCADE ON DELETE RESTRICT,
    id_sucursal     INT NOT NULL REFERENCES sucursal(id_sucursal)
                        ON UPDATE CASCADE ON DELETE RESTRICT,
    id_metodo_pago  INT NOT NULL REFERENCES metodo_pago(id_metodo_pago)
                        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE detalle_venta (
    id_venta        INT NOT NULL REFERENCES venta(id_venta)
                        ON UPDATE CASCADE ON DELETE CASCADE,
    id_producto     INT NOT NULL REFERENCES producto(id_producto)
                        ON UPDATE CASCADE ON DELETE RESTRICT,
    cantidad        INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    descuento       NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    subtotal        NUMERIC(12,2) GENERATED ALWAYS AS
                        (cantidad * precio_unitario - descuento) STORED
                        CHECK (subtotal >= 0),
    PRIMARY KEY (id_venta, id_producto)
);

-- IMEI vendido en cada línea de venta (solo productos celular).
CREATE TABLE detalle_venta_unidad (
    id_unidad    INT PRIMARY KEY,            -- una unidad se vende una sola vez
    id_venta     INT NOT NULL,
    id_producto  INT NOT NULL,
    FOREIGN KEY (id_venta, id_producto)
        REFERENCES detalle_venta(id_venta, id_producto)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_unidad, id_producto)     -- el IMEI es del producto de la línea
        REFERENCES unidad_celular(id_unidad, id_producto)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE factura (
    id_factura      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_factura  VARCHAR(30)  NOT NULL UNIQUE,
    nit_cliente     VARCHAR(20),             -- copia fiscal al momento de emitir
    razon_social    VARCHAR(100),
    fecha_emision   DATE NOT NULL DEFAULT CURRENT_DATE,
    codigo_control  VARCHAR(40),
    id_venta        INT NOT NULL UNIQUE      -- 0..1 factura por venta
                        REFERENCES venta(id_venta)
                        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE promocion (
    id_promocion          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre                VARCHAR(80) NOT NULL,
    descripcion           VARCHAR(200),
    porcentaje_descuento  NUMERIC(5,2) NOT NULL
                              CHECK (porcentaje_descuento BETWEEN 0 AND 100),
    fecha_inicio          DATE NOT NULL,
    fecha_fin             DATE NOT NULL,
    estado                VARCHAR(15) NOT NULL DEFAULT 'Vigente'
                              CHECK (estado IN ('Vigente','Vencida','Cancelada')),
    id_producto           INT NOT NULL REFERENCES producto(id_producto)
                              ON UPDATE CASCADE ON DELETE CASCADE,
    CHECK (fecha_fin >= fecha_inicio)
);

-- Movimientos de stock. Entrada/Ajuste_entrada: solo destino.
-- Salida/Ajuste_salida: solo origen. Traslado: origen y destino distintos.
CREATE TABLE movimiento_inventario (
    id_movimiento       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento     VARCHAR(20) NOT NULL
                            CHECK (tipo_movimiento IN
                              ('Entrada','Salida','Traslado','Ajuste_entrada','Ajuste_salida')),
    cantidad            INT NOT NULL CHECK (cantidad > 0),
    motivo              VARCHAR(150),
    id_producto         INT NOT NULL REFERENCES producto(id_producto)
                            ON UPDATE CASCADE ON DELETE RESTRICT,
    id_almacen_origen   INT REFERENCES almacen(id_almacen)
                            ON UPDATE CASCADE ON DELETE RESTRICT,
    id_almacen_destino  INT REFERENCES almacen(id_almacen)
                            ON UPDATE CASCADE ON DELETE RESTRICT,
    id_empleado         INT NOT NULL REFERENCES empleado(id_empleado)
                            ON UPDATE CASCADE ON DELETE RESTRICT,
    id_compra           INT REFERENCES compra_proveedor(id_compra)
                            ON UPDATE CASCADE ON DELETE RESTRICT,
    id_venta            INT REFERENCES venta(id_venta)
                            ON UPDATE CASCADE ON DELETE RESTRICT,
    CHECK (
        (tipo_movimiento IN ('Entrada','Ajuste_entrada')
            AND id_almacen_destino IS NOT NULL AND id_almacen_origen IS NULL)
     OR (tipo_movimiento IN ('Salida','Ajuste_salida')
            AND id_almacen_origen IS NOT NULL AND id_almacen_destino IS NULL)
     OR (tipo_movimiento = 'Traslado'
            AND id_almacen_origen IS NOT NULL AND id_almacen_destino IS NOT NULL
            AND id_almacen_origen <> id_almacen_destino)
    )
);

-- =====================================================================
-- 7. POSVENTA
-- =====================================================================

CREATE TABLE garantia (
    id_garantia   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_inicio  DATE NOT NULL,
    meses         SMALLINT NOT NULL CHECK (meses > 0),
    fecha_fin     DATE GENERATED ALWAYS AS
                      ((fecha_inicio + make_interval(months => meses))::date) STORED,
    tipo_garantia VARCHAR(30),
    condiciones   VARCHAR(300),
    estado        VARCHAR(15) NOT NULL DEFAULT 'Vigente'
                      CHECK (estado IN ('Vigente','Vencida','Anulada','Utilizada')),
    id_venta      INT NOT NULL,
    id_producto   INT NOT NULL,
    id_unidad     INT,                        -- IMEI cubierto (si es celular)
    FOREIGN KEY (id_venta, id_producto)
        REFERENCES detalle_venta(id_venta, id_producto)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_unidad, id_producto)
        REFERENCES unidad_celular(id_unidad, id_producto)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE repuesto (
    id_repuesto     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre          VARCHAR(80) NOT NULL,
    descripcion     VARCHAR(200),
    precio          NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    stock           INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    compatibilidad  VARCHAR(100),
    id_proveedor    INT NOT NULL REFERENCES proveedor(id_proveedor)
                        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Equipo que el cliente trae a reparar y que NO se compró en la tienda.
CREATE TABLE equipo_externo (
    id_equipo   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    imei        VARCHAR(20) UNIQUE,
    modelo      VARCHAR(60) NOT NULL,
    color       VARCHAR(30),
    id_marca    INT NOT NULL REFERENCES marca(id_marca)
                    ON UPDATE CASCADE ON DELETE RESTRICT,
    id_cliente  INT NOT NULL REFERENCES cliente(id_cliente)
                    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Se repara una unidad de la tienda O un equipo externo (exactamente uno).
CREATE TABLE reparacion (
    id_reparacion          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_ingreso          DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega_estimada DATE,
    fecha_entrega_real     DATE,
    falla_reportada        VARCHAR(300) NOT NULL,
    diagnostico            VARCHAR(300),
    costo_mano_obra        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (costo_mano_obra >= 0),
    estado                 VARCHAR(20) NOT NULL DEFAULT 'Recibido'
                               CHECK (estado IN ('Recibido','Diagnostico','En reparacion',
                                                 'Listo','Entregado','Cancelado')),
    id_cliente             INT NOT NULL REFERENCES cliente(id_cliente)
                               ON UPDATE CASCADE ON DELETE RESTRICT,
    id_unidad              INT REFERENCES unidad_celular(id_unidad)
                               ON UPDATE CASCADE ON DELETE RESTRICT,
    id_equipo              INT REFERENCES equipo_externo(id_equipo)
                               ON UPDATE CASCADE ON DELETE RESTRICT,
    id_garantia            INT REFERENCES garantia(id_garantia)
                               ON UPDATE CASCADE ON DELETE RESTRICT,
    id_empleado_tecnico    INT NOT NULL REFERENCES empleado(id_empleado)
                               ON UPDATE CASCADE ON DELETE RESTRICT,
    CHECK (num_nonnulls(id_unidad, id_equipo) = 1),
    CHECK (fecha_entrega_estimada IS NULL OR fecha_entrega_estimada >= fecha_ingreso),
    CHECK (fecha_entrega_real     IS NULL OR fecha_entrega_real     >= fecha_ingreso)
);

CREATE TABLE detalle_reparacion (
    id_reparacion   INT NOT NULL REFERENCES reparacion(id_reparacion)
                        ON UPDATE CASCADE ON DELETE CASCADE,
    id_repuesto     INT NOT NULL REFERENCES repuesto(id_repuesto)
                        ON UPDATE CASCADE ON DELETE RESTRICT,
    cantidad        INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    PRIMARY KEY (id_reparacion, id_repuesto)
);

-- =====================================================================
-- ÍNDICES sobre llaves foráneas (PostgreSQL no los crea automáticamente)
-- =====================================================================
CREATE INDEX idx_departamento_pais     ON departamento(id_pais);
CREATE INDEX idx_ciudad_departamento   ON ciudad(id_departamento);
CREATE INDEX idx_telefono_cliente      ON telefono_cliente(id_cliente);
CREATE INDEX idx_sucursal_ciudad       ON sucursal(id_ciudad);
CREATE INDEX idx_empleado_cargo        ON empleado(id_cargo);
CREATE INDEX idx_empleado_sucursal     ON empleado(id_sucursal);
CREATE INDEX idx_almacen_sucursal      ON almacen(id_sucursal);
CREATE INDEX idx_almacen_responsable   ON almacen(id_empleado_responsable);
CREATE INDEX idx_marca_pais            ON marca(id_pais);
CREATE INDEX idx_producto_marca        ON producto(id_marca);
CREATE INDEX idx_producto_categoria    ON producto(id_categoria);
CREATE INDEX idx_producto_tipo         ON producto(tipo_producto);
CREATE INDEX idx_proveedor_ciudad      ON proveedor(id_ciudad);
CREATE INDEX idx_unidad_producto       ON unidad_celular(id_producto);
CREATE INDEX idx_unidad_almacen        ON unidad_celular(id_almacen);
CREATE INDEX idx_unidad_compra         ON unidad_celular(id_compra);
CREATE INDEX idx_inventario_producto   ON inventario(id_producto);
CREATE INDEX idx_compra_proveedor      ON compra_proveedor(id_proveedor);
CREATE INDEX idx_compra_empleado       ON compra_proveedor(id_empleado);
CREATE INDEX idx_compra_metodo         ON compra_proveedor(id_metodo_pago);
CREATE INDEX idx_detcompra_producto    ON detalle_compra(id_producto);
CREATE INDEX idx_mov_producto          ON movimiento_inventario(id_producto);
CREATE INDEX idx_mov_origen            ON movimiento_inventario(id_almacen_origen);
CREATE INDEX idx_mov_destino           ON movimiento_inventario(id_almacen_destino);
CREATE INDEX idx_mov_empleado          ON movimiento_inventario(id_empleado);
CREATE INDEX idx_mov_compra            ON movimiento_inventario(id_compra);
CREATE INDEX idx_mov_venta             ON movimiento_inventario(id_venta);
CREATE INDEX idx_venta_cliente         ON venta(id_cliente);
CREATE INDEX idx_venta_empleado        ON venta(id_empleado);
CREATE INDEX idx_venta_sucursal        ON venta(id_sucursal);
CREATE INDEX idx_venta_metodo          ON venta(id_metodo_pago);
CREATE INDEX idx_venta_fecha           ON venta(fecha_hora);
CREATE INDEX idx_detventa_producto     ON detalle_venta(id_producto);
CREATE INDEX idx_detventaunidad_linea  ON detalle_venta_unidad(id_venta, id_producto);
CREATE INDEX idx_promocion_producto    ON promocion(id_producto);
CREATE INDEX idx_garantia_linea        ON garantia(id_venta, id_producto);
CREATE INDEX idx_garantia_unidad       ON garantia(id_unidad);
CREATE INDEX idx_repuesto_proveedor    ON repuesto(id_proveedor);
CREATE INDEX idx_equipo_marca          ON equipo_externo(id_marca);
CREATE INDEX idx_equipo_cliente        ON equipo_externo(id_cliente);
CREATE INDEX idx_reparacion_cliente    ON reparacion(id_cliente);
CREATE INDEX idx_reparacion_unidad     ON reparacion(id_unidad);
CREATE INDEX idx_reparacion_equipo     ON reparacion(id_equipo);
CREATE INDEX idx_reparacion_garantia   ON reparacion(id_garantia);
CREATE INDEX idx_reparacion_tecnico    ON reparacion(id_empleado_tecnico);
CREATE INDEX idx_detrep_repuesto       ON detalle_reparacion(id_repuesto);

-- Verificación: debe devolver 33
-- SELECT count(*) FROM information_schema.tables
--  WHERE table_schema = 'celulares' AND table_type = 'BASE TABLE';
