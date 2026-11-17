import { useState } from 'react';
import { reportsApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import SalesBars from '../../components/panel/SalesBars';
import StatCard from '../../components/panel/StatCard';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatBs } from '../../utils/format';
import { formatDayMonth } from '../../utils/panelFormat';

const iso = (d) => d.toISOString().slice(0, 10);
const today = () => new Date();
const RANGES = {
  hoy: () => [iso(today()), iso(today())],
  semana: () => { const d = today(); d.setDate(d.getDate() - 6); return [iso(d), iso(today())]; },
  mes: () => { const d = today(); return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), iso(d)]; },
  todo: () => ['', ''],
};

const money = (key, header) => ({ key, header, align: 'right', render: (r) => formatBs(r[key]) });

export default function ReportsPage() {
  usePageTitle('Reportes');
  const [[desde, hasta], setRange] = useState(RANGES.mes());
  const { data, loading, error, reload } = useAsync(() => reportsApi.sales({ desde, hasta }), [desde, hasta]);
  const margin = data && data.total > 0 ? Math.round((data.utilidad / data.total) * 100) : 0;

  return (
    <>
      <PageHeader title="Reportes de ventas" subtitle="Ventas completadas del período. La utilidad usa el costo de compra actual de cada producto." />
      <div className="buttons mb-2 no-print">
        {Object.keys(RANGES).map((k) => <button key={k} type="button" className="button is-small is-rounded is-primary is-outlined" onClick={() => setRange(RANGES[k]())}>{{ hoy: 'Hoy', semana: 'Últimos 7 días', mes: 'Este mes', todo: 'Todo' }[k]}</button>)}
      </div>
      <div className="field is-grouped no-print">
        <div className="control"><label className="help" htmlFor="rep-desde">Desde</label><input id="rep-desde" className="input" type="date" value={desde} onChange={(e) => setRange([e.target.value, hasta])} /></div>
        <div className="control"><label className="help" htmlFor="rep-hasta">Hasta</label><input id="rep-hasta" className="input" type="date" value={hasta} onChange={(e) => setRange([desde, e.target.value])} /></div>
        <div className="control" style={{ alignSelf: 'flex-end' }}><button type="button" className="button is-primary is-outlined" onClick={() => window.print()}>Imprimir</button></div>
      </div>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <div className="columns is-multiline">
              <div className="column is-3"><StatCard label="Vendido" value={formatBs(data.total)} hint={`${data.ventas} ventas`} /></div>
              <div className="column is-3"><StatCard label="Costo" value={formatBs(data.costo)} /></div>
              <div className="column is-3"><StatCard label="Utilidad" value={formatBs(data.utilidad)} hint={`Margen ${margin}%`} /></div>
              <div className="column is-3"><StatCard label="Ventas anuladas" value={data.anuladas} tone={data.anuladas ? 'warn' : undefined} /></div>
            </div>
            {data.por_dia.length > 0 && (
              <div className="box"><h2 className="title is-6">Ventas por día</h2>
                <SalesBars ariaLabel="Ventas por día" items={data.por_dia.slice(-14).map((d) => ({ key: d.dia, label: formatDayMonth(d.dia), total: d.total }))} />
              </div>
            )}
            <h2 className="title is-5">Por vendedor</h2>
            <DataTable title="ventas_por_vendedor" rowKey="id_empleado" rows={data.por_vendedor} columns={[{ key: 'vendedor', header: 'Vendedor' }, { key: 'ventas', header: 'Ventas', align: 'right' }, money('total', 'Total')]} emptyTitle="Sin ventas" emptyMessage="No hay ventas en el período." />
            <h2 className="title is-5 mt-5">Por producto</h2>
            <DataTable title="ventas_por_producto" rowKey="id_producto" rows={data.por_producto} columns={[{ key: 'producto', header: 'Producto' }, { key: 'unidades', header: 'Unid.', align: 'right' }, money('ingresos', 'Ingresos'), money('costo', 'Costo'), money('utilidad', 'Utilidad')]} emptyTitle="Sin ventas" emptyMessage="No hay ventas en el período." />
            <h2 className="title is-5 mt-5">Por marca</h2>
            <DataTable title="ventas_por_marca" rowKey="marca" rows={data.por_marca} columns={[{ key: 'marca', header: 'Marca' }, { key: 'unidades', header: 'Unid.', align: 'right' }, money('ingresos', 'Ingresos'), money('utilidad', 'Utilidad')]} emptyTitle="Sin ventas" emptyMessage="No hay ventas en el período." />
            <h2 className="title is-5 mt-5">Por método de pago</h2>
            <DataTable title="ventas_por_metodo" rowKey="metodo" rows={data.por_metodo} columns={[{ key: 'metodo', header: 'Método' }, { key: 'ventas', header: 'Ventas', align: 'right' }, money('total', 'Total')]} emptyTitle="Sin ventas" emptyMessage="No hay ventas en el período." />
          </>
        )}
      </AsyncView>
    </>
  );
}
