-- =====================================================================
-- Vistas y triggers · Empresa de celulares (v2)
-- Ejecutar DESPUÉS de 01_esquema.sql
-- =====================================================================
SET search_path TO celulares;

-- ---------------------------------------------------------------------
-- TRIGGER 1: movimiento_inventario es la ÚNICA vía para cambiar el stock.
-- Resta del almacén origen y suma al destino. Si el stock quedara
-- negativo, el CHECK (stock_actual >= 0) de inventario aborta la operación.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_aplicar_movimiento() RETURNS trigger AS $$
BEGIN
    IF NEW.id_almacen_origen IS NOT NULL THEN
        UPDATE inventario
           SET stock_actual = stock_actual - NEW.cantidad,
               fecha_ultima_actualizacion = CURRENT_TIMESTAMP
         WHERE id_almacen = NEW.id_almacen_origen
           AND id_producto = NEW.id_producto;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'No hay inventario del producto % en el almacén %',
                NEW.id_producto, NEW.id_almacen_origen;
        END IF;
    END IF;

    IF NEW.id_almacen_destino IS NOT NULL THEN
        INSERT INTO inventario (id_almacen, id_producto, stock_actual)
        VALUES (NEW.id_almacen_destino, NEW.id_producto, NEW.cantidad)
        ON CONFLICT (id_almacen, id_producto) DO UPDATE
           SET stock_actual = inventario.stock_actual + EXCLUDED.stock_actual,
               fecha_ultima_actualizacion = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_movimiento_inventario
AFTER INSERT ON movimiento_inventario
FOR EACH ROW EXECUTE FUNCTION fn_aplicar_movimiento();

-- Los movimientos son un historial: no se editan ni se borran.
CREATE OR REPLACE FUNCTION fn_movimiento_inmutable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'movimiento_inventario es un historial: registre un movimiento de ajuste';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_movimiento_inmutable
BEFORE UPDATE OR DELETE ON movimiento_inventario
FOR EACH ROW EXECUTE FUNCTION fn_movimiento_inmutable();

-- ---------------------------------------------------------------------
-- TRIGGER 2: al asignar un IMEI a una venta, la unidad pasa a 'Vendido'.
-- Solo se puede vender una unidad 'Disponible' o 'Reservada'.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_unidad_vendida() RETURNS trigger AS $$
DECLARE
    v_estado VARCHAR(20);
BEGIN
    SELECT estado INTO v_estado FROM unidad_celular WHERE id_unidad = NEW.id_unidad FOR UPDATE;
    IF v_estado NOT IN ('Disponible','Reservado') THEN
        RAISE EXCEPTION 'La unidad % no se puede vender (estado: %)', NEW.id_unidad, v_estado;
    END IF;
    UPDATE unidad_celular SET estado = 'Vendido' WHERE id_unidad = NEW.id_unidad;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_unidad_vendida
BEFORE INSERT ON detalle_venta_unidad
FOR EACH ROW EXECUTE FUNCTION fn_unidad_vendida();

-- =====================================================================
-- VISTAS (aquí viven los totales que ya no se guardan en las tablas)
-- =====================================================================

-- Total de cada venta = suma de líneas - descuento general + impuesto
CREATE OR REPLACE VIEW v_venta_total AS
SELECT v.id_venta,
       v.fecha_hora,
       v.estado,
       v.id_cliente,
       v.id_empleado,
       v.id_sucursal,
       v.id_metodo_pago,
       COALESCE(SUM(d.subtotal), 0)                                  AS subtotal,
       v.descuento,
       v.impuesto,
       COALESCE(SUM(d.subtotal), 0) - v.descuento + v.impuesto       AS total
FROM venta v
LEFT JOIN detalle_venta d ON d.id_venta = v.id_venta
GROUP BY v.id_venta;

-- Total de cada compra a proveedor
CREATE OR REPLACE VIEW v_compra_total AS
SELECT c.id_compra,
       c.fecha_compra,
       c.numero_factura,
       c.estado,
       c.id_proveedor,
       COALESCE(SUM(d.subtotal), 0)                    AS subtotal,
       c.descuento,
       COALESCE(SUM(d.subtotal), 0) - c.descuento      AS total
FROM compra_proveedor c
LEFT JOIN detalle_compra d ON d.id_compra = c.id_compra
GROUP BY c.id_compra;

-- Costo de cada reparación = mano de obra + repuestos
-- (si la reparación está cubierta por garantía el costo para el cliente es 0)
CREATE OR REPLACE VIEW v_reparacion_total AS
SELECT r.id_reparacion,
       r.fecha_ingreso,
       r.estado,
       r.id_cliente,
       r.id_garantia,
       r.costo_mano_obra,
       COALESCE(SUM(d.subtotal), 0)                                   AS costo_repuestos,
       r.costo_mano_obra + COALESCE(SUM(d.subtotal), 0)               AS costo_total,
       CASE WHEN r.id_garantia IS NOT NULL THEN 0
            ELSE r.costo_mano_obra + COALESCE(SUM(d.subtotal), 0) END AS a_cobrar
FROM reparacion r
LEFT JOIN detalle_reparacion d ON d.id_reparacion = r.id_reparacion
GROUP BY r.id_reparacion;

-- Factura con su monto (viene de la venta)
CREATE OR REPLACE VIEW v_factura AS
SELECT f.*, vt.total AS monto_total
FROM factura f
JOIN v_venta_total vt ON vt.id_venta = f.id_venta;

-- Stock por producto sumando todos los almacenes, con alerta de reposición
CREATE OR REPLACE VIEW v_stock_producto AS
SELECT p.id_producto,
       p.codigo,
       p.nombre,
       p.tipo_producto,
       COALESCE(SUM(i.stock_actual), 0) AS stock_total,
       COALESCE(SUM(i.stock_minimo), 0) AS stock_minimo_total,
       COALESCE(SUM(i.stock_actual), 0) <= COALESCE(SUM(i.stock_minimo), 0)
           AND COALESCE(SUM(i.stock_minimo), 0) > 0 AS requiere_reposicion
FROM producto p
LEFT JOIN inventario i ON i.id_producto = p.id_producto
GROUP BY p.id_producto;

-- Control de consistencia: el stock de cada celular debe coincidir con la
-- cantidad de IMEI 'Disponible' o 'Reservado' en ese almacén.
-- Cualquier fila con diferencia <> 0 indica un descuadre.
CREATE OR REPLACE VIEW v_conciliacion_celulares AS
SELECT i.id_almacen,
       i.id_producto,
       i.stock_actual,
       COUNT(u.id_unidad) FILTER (WHERE u.estado IN ('Disponible','Reservado')) AS unidades_en_almacen,
       i.stock_actual
         - COUNT(u.id_unidad) FILTER (WHERE u.estado IN ('Disponible','Reservado')) AS diferencia
FROM inventario i
JOIN celular c ON c.id_producto = i.id_producto
LEFT JOIN unidad_celular u
       ON u.id_producto = i.id_producto AND u.id_almacen = i.id_almacen
GROUP BY i.id_almacen, i.id_producto, i.stock_actual;

-- Garantías con días restantes (útil para la app y la web)
CREATE OR REPLACE VIEW v_garantia_vigencia AS
SELECT g.id_garantia, g.id_venta, g.id_producto, g.id_unidad,
       g.fecha_inicio, g.fecha_fin,
       GREATEST(g.fecha_fin - CURRENT_DATE, 0) AS dias_restantes,
       CASE WHEN g.estado = 'Vigente' AND g.fecha_fin < CURRENT_DATE
            THEN 'Vencida' ELSE g.estado END    AS estado_real
FROM garantia g;
