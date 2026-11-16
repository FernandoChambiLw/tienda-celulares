-- =====================================================================
-- Extensión v2.1: pedidos de la tienda en línea y fotos de producto
-- Es IDEMPOTENTE (CREATE ... IF NOT EXISTS): se puede ejecutar varias veces.
-- Se aplica sobre las 33 tablas de 01_esquema.sql (queda en 36 tablas).
--   + pedido         : pedido hecho por un cliente desde el carrito web
--   + detalle_pedido : productos del pedido (precio congelado al pedir)
--   + producto_foto  : la imagen vive en la base y sobrevive a los
--                      reinicios del servidor (antes se guardaba en disco)
-- =====================================================================
SET search_path TO celulares;

CREATE TABLE IF NOT EXISTS pedido (
    id_pedido          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_hora         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nombre_cliente     VARCHAR(100) NOT NULL,
    telefono           VARCHAR(20)  NOT NULL,
    ci                 VARCHAR(20),
    notas              VARCHAR(300),
    estado             VARCHAR(15)  NOT NULL DEFAULT 'Nuevo'
                           CHECK (estado IN ('Nuevo','Confirmado','Entregado','Cancelado')),
    id_usuario_atendio INT REFERENCES usuario(id_usuario)
                           ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
    id_pedido       INT      NOT NULL REFERENCES pedido(id_pedido)
                                 ON UPDATE CASCADE ON DELETE CASCADE,
    id_producto     INT      NOT NULL REFERENCES producto(id_producto)
                                 ON UPDATE CASCADE ON DELETE RESTRICT,
    cantidad        SMALLINT NOT NULL CHECK (cantidad BETWEEN 1 AND 10),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    PRIMARY KEY (id_pedido, id_producto)
);

CREATE TABLE IF NOT EXISTS producto_foto (
    id_producto INT PRIMARY KEY REFERENCES producto(id_producto)
                    ON UPDATE CASCADE ON DELETE CASCADE,
    tipo_mime   VARCHAR(15) NOT NULL CHECK (tipo_mime IN ('image/jpeg','image/png','image/webp')),
    datos       BYTEA       NOT NULL CHECK (octet_length(datos) <= 3145728),
    actualizada TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_pedido_estado_fecha ON pedido (estado, fecha_hora DESC);

-- Total de cada pedido (derivado, no se guarda: igual criterio que v_venta_total).
CREATE OR REPLACE VIEW v_pedido_total AS
SELECT p.*, COALESCE(SUM(d.cantidad * d.precio_unitario), 0)::NUMERIC(12,2) AS total,
       COALESCE(SUM(d.cantidad), 0)::INT AS unidades
  FROM pedido p LEFT JOIN detalle_pedido d USING (id_pedido)
 GROUP BY p.id_pedido;
