-- =====================================================================
-- Extensión v4 (Fase 2): bitácora, caja diaria y cuentas por cobrar.
-- IDEMPOTENTE. Se aplica sobre las 36 tablas anteriores (queda en 41).
--   + bitacora       : quién hizo qué y cuándo (anular ventas, precios, etc.)
--   + caja           : apertura y cierre de caja por empleado
--   + movimiento_caja: ingresos / egresos manuales de la caja
--   + cuenta_cobrar  : venta a crédito (una por venta)
--   + abono_cuenta   : pagos parciales de una cuenta por cobrar
-- =====================================================================
SET search_path TO celulares;

CREATE TABLE IF NOT EXISTS bitacora (
    id_bitacora INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_hora  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario  INT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    usuario     VARCHAR(50),
    accion      VARCHAR(40) NOT NULL,
    entidad     VARCHAR(30) NOT NULL,
    id_entidad  INT,
    detalle     VARCHAR(400)
);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora(fecha_hora DESC);

CREATE TABLE IF NOT EXISTS caja (
    id_caja        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_empleado    INT NOT NULL REFERENCES empleado(id_empleado) ON DELETE RESTRICT,
    apertura       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto_inicial  NUMERIC(12,2) NOT NULL CHECK (monto_inicial >= 0),
    cierre         TIMESTAMP,
    monto_esperado NUMERIC(12,2),
    monto_contado  NUMERIC(12,2) CHECK (monto_contado >= 0),
    diferencia     NUMERIC(12,2),
    observacion    VARCHAR(300),
    estado         VARCHAR(10) NOT NULL DEFAULT 'Abierta' CHECK (estado IN ('Abierta','Cerrada'))
);
-- una sola caja abierta por empleado
CREATE UNIQUE INDEX IF NOT EXISTS uq_caja_abierta ON caja(id_empleado) WHERE estado = 'Abierta';

CREATE TABLE IF NOT EXISTS movimiento_caja (
    id_movimiento INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_caja       INT NOT NULL REFERENCES caja(id_caja) ON DELETE CASCADE,
    fecha_hora    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo          VARCHAR(10) NOT NULL CHECK (tipo IN ('Ingreso','Egreso')),
    monto         NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    concepto      VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS cuenta_cobrar (
    id_cuenta  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_venta   INT NOT NULL UNIQUE REFERENCES venta(id_venta) ON DELETE CASCADE,
    id_cliente INT NOT NULL REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
    total      NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    vence      DATE,
    estado     VARCHAR(10) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Pagada','Anulada'))
);
CREATE INDEX IF NOT EXISTS idx_cuenta_cliente ON cuenta_cobrar(id_cliente);

CREATE TABLE IF NOT EXISTS abono_cuenta (
    id_abono       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_cuenta      INT NOT NULL REFERENCES cuenta_cobrar(id_cuenta) ON DELETE CASCADE,
    fecha_hora     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto          NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    id_metodo_pago INT NOT NULL REFERENCES metodo_pago(id_metodo_pago),
    id_empleado    INT NOT NULL REFERENCES empleado(id_empleado)
);
CREATE INDEX IF NOT EXISTS idx_abono_cuenta ON abono_cuenta(id_cuenta);

CREATE OR REPLACE VIEW v_cuenta_saldo AS
SELECT c.*, COALESCE(SUM(a.monto),0) AS pagado, c.total - COALESCE(SUM(a.monto),0) AS saldo
FROM cuenta_cobrar c LEFT JOIN abono_cuenta a USING (id_cuenta)
GROUP BY c.id_cuenta;
