import { Link } from 'react-router-dom';
import { reportsApi } from '../../api/panel/panelApi';
import { useAsync } from '../../hooks/useAsync';
import { formatBs } from '../../utils/format';
import { formatDayMonth, formatMonth } from '../../utils/panelFormat';
import AsyncView from '../ui/AsyncView';
import DataTable from './DataTable';
import SalesBars from './SalesBars';
import StatCard from './StatCard';
import styles from './AdminSummary.module.css';

// Resumen del negocio (solo Administrador): cifras del día, del mes y alertas.
export default function AdminSummary() {
  const { data, loading, error, reload } = useAsync(() => reportsApi.summary(), []);

  return (
    <AsyncView loading={loading} error={error} onRetry={reload}>
      {data && (
        <div className={styles.stack}>
          {(() => {
            const dias = data.ultimo_respaldo ? Math.floor((Date.now() - new Date(data.ultimo_respaldo.replace(' ', 'T') + 'Z').getTime()) / 86400000) : null;
            if (dias !== null && dias < 7) return null;
            return (
              <div className={`${styles.backup} no-print`} role="note">
                {dias === null ? 'Todavía no hiciste ningún respaldo de tus datos.' : `Tu último respaldo fue hace ${dias} días.`}{' '}
                <Link to="/panel/respaldo">Descargar respaldo ahora</Link>
              </div>
            );
          })()}
          <div className={styles.stats}>
            <StatCard label="Ventas de hoy" value={formatBs(Number(data.ventas_hoy.total))} hint={`${data.ventas_hoy.ventas} ventas`} />
            <StatCard label="Ventas del mes" value={formatBs(Number(data.ventas_mes.total))} hint={`${data.ventas_mes.ventas} ventas`} />
            <StatCard label="Pedidos nuevos" value={data.pedidos_nuevos ?? 0} hint="de la tienda en línea" tone={data.pedidos_nuevos ? 'warn' : undefined} />
            <StatCard label="Por cobrar" value={formatBs(Number(data.por_cobrar?.total ?? 0))} hint={`${data.por_cobrar?.n ?? 0} cuentas a crédito`} tone={data.por_cobrar?.n ? 'warn' : undefined} />
            <StatCard label="Cajas abiertas" value={data.cajas_abiertas ?? 0} hint="sin cerrar" />
            <StatCard label="Bajo stock" value={data.productos_bajo_stock} hint="productos por reponer" tone={data.productos_bajo_stock ? 'warn' : undefined} />
            <StatCard label="Garantías por vencer" value={data.garantias_por_vencer_30d} hint="en los próximos 30 días" />
          </div>

          <section>
            <h2 className={styles.h2}>Últimos 7 días</h2>
            {data.ventas_ultimos_7_dias.length ? (
              <SalesBars
                ariaLabel="Ventas de los últimos 7 días"
                items={data.ventas_ultimos_7_dias.map((d) => ({ key: d.dia, label: formatDayMonth(d.dia), total: d.total }))}
              />
            ) : (
              <p className={styles.muted}>Todavía no hay ventas esta semana.</p>
            )}
          </section>

          <section>
            <h2 className={styles.h2}>Últimos 6 meses</h2>
            {data.ventas_ultimos_6_meses?.length ? (
              <SalesBars
                ariaLabel="Ventas de los últimos 6 meses"
                items={data.ventas_ultimos_6_meses.map((m) => ({ key: m.mes, label: formatMonth(m.mes), total: m.total }))}
              />
            ) : (
              <p className={styles.muted}>Todavía no hay ventas en los últimos meses.</p>
            )}
          </section>

          <div className={styles.two}>
            <section>
              <h2 className={styles.h2}>Más vendidos (30 días)</h2>
              <DataTable
                compact
                rowKey="id_producto"
                rows={data.top_productos_30d}
                emptyTitle="Sin ventas"
                columns={[
                  { key: 'nombre', header: 'Producto' },
                  { key: 'unidades', header: 'Unid.', align: 'right' },
                  { key: 'ingresos', header: 'Ingresos', align: 'right', render: (r) => formatBs(Number(r.ingresos)) },
                ]}
              />
            </section>
            <section>
              <h2 className={styles.h2}>Reparaciones por estado</h2>
              <DataTable
                compact
                rowKey="estado"
                rows={data.reparaciones_por_estado}
                emptyTitle="Sin reparaciones"
                columns={[
                  { key: 'estado', header: 'Estado' },
                  { key: 'cantidad', header: 'Cantidad', align: 'right' },
                ]}
              />
            </section>
          </div>
        </div>
      )}
    </AsyncView>
  );
}
