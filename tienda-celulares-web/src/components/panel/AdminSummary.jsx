import { reportsApi } from '../../api/panel/panelApi';
import { useAsync } from '../../hooks/useAsync';
import { formatBs } from '../../utils/format';
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
          <div className={styles.stats}>
            <StatCard label="Ventas de hoy" value={formatBs(Number(data.ventas_hoy.total))} hint={`${data.ventas_hoy.ventas} ventas`} />
            <StatCard label="Ventas del mes" value={formatBs(Number(data.ventas_mes.total))} hint={`${data.ventas_mes.ventas} ventas`} />
            <StatCard label="Bajo stock" value={data.productos_bajo_stock} hint="productos por reponer" tone={data.productos_bajo_stock ? 'warn' : undefined} />
            <StatCard label="Garantías por vencer" value={data.garantias_por_vencer_30d} hint="en los próximos 30 días" />
          </div>

          <section>
            <h2 className={styles.h2}>Últimos 7 días</h2>
            {data.ventas_ultimos_7_dias.length ? (
              <SalesBars days={data.ventas_ultimos_7_dias} />
            ) : (
              <p className={styles.muted}>Todavía no hay ventas esta semana.</p>
            )}
          </section>

          <div className={styles.two}>
            <section>
              <h2 className={styles.h2}>Más vendidos (30 días)</h2>
              <DataTable
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
