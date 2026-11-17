import { reportsApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatBs } from '../../utils/format';

export default function RestockPage() {
  usePageTitle('Reposición');
  const { data, loading, error, reload } = useAsync(() => reportsApi.restock(), []);
  const columns = [
    { key: 'proveedor', header: 'Último proveedor', render: (r) => r.proveedor ?? 'Sin compras previas' },
    { key: 'codigo', header: 'Código' },
    { key: 'producto', header: 'Producto' },
    { key: 'stock_total', header: 'Stock', align: 'right' },
    { key: 'stock_minimo_total', header: 'Mínimo', align: 'right' },
    { key: 'sugerido', header: 'Pedir', align: 'right', render: (r) => <strong>{r.sugerido}</strong> },
    { key: 'ultimo_costo', header: 'Último costo', align: 'right', render: (r) => (r.ultimo_costo == null ? '—' : formatBs(r.ultimo_costo)) },
  ];
  return (
    <>
      <PageHeader title="Reposición de stock" subtitle="Productos en o bajo su stock mínimo, agrupados por el proveedor al que se les compró la última vez. Sugerido = llegar al doble del mínimo." />
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <DataTable title="reposicion" rowKey="id_producto" rows={data ?? []} columns={columns} emptyTitle="Todo en orden" emptyMessage="Ningún producto está bajo su stock mínimo." />
      </AsyncView>
    </>
  );
}
