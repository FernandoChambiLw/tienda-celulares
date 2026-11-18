-- Extensión v7 (producción). IDEMPOTENTE. Sin tablas nuevas.
SET search_path TO celulares;
-- Obliga a cambiar la clave inicial (o la que un administrador restablece) en el primer ingreso.
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS debe_cambiar_clave BOOLEAN NOT NULL DEFAULT FALSE;
-- Un pedido en línea reserva stock mientras está Nuevo o Confirmado: esta vista suma lo reservado por producto.
CREATE OR REPLACE VIEW v_stock_reservado AS
SELECT dp.id_producto, SUM(dp.cantidad)::int AS reservado
  FROM detalle_pedido dp JOIN pedido p USING (id_pedido)
 WHERE p.estado IN ('Nuevo','Confirmado')
 GROUP BY dp.id_producto;
