import { inventoryApi } from '../../api/panel/panelApi';
import { useAsync } from '../../hooks/useAsync';
import AsyncView from '../ui/AsyncView';
import DataTable from './DataTable';

// Productos por debajo (o igual) del stock mínimo.
export default function StockAlerts() {
  const { data, loading, error, reload } = useAsync(() => inventoryApi.alerts(), []);
  return (
    <AsyncView loading={loading} error={error} onRetry={reload}>
      <DataTable
        rowKey="key"
        rows={(data ?? []).map((r) => ({ ...r, key: `${r.id_almacen}-${r.id_producto}` }))}
        emptyTitle="Todo el stock está en orden"
        emptyMessage="Ningún producto está por debajo de su mínimo."
        columns={[
          { key: 'producto', header: 'Producto' },
          { key: 'almacen', header: 'Almacén' },
          { key: 'stock_actual', header: 'Stock', align: 'right' },
          { key: 'stock_minimo', header: 'Mínimo', align: 'right' },
        ]}
      />
    </AsyncView>
  );
}
