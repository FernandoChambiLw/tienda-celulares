import { useMemo, useState } from 'react';
import { inventoryApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import Pill from '../../components/panel/Pill';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './Panel.module.css';

export default function InventoryPage() {
  usePageTitle('Inventario');
  const { data, loading, error, reload } = useAsync(() => inventoryApi.stock(), []);
  const [text, setText] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);

  const rows = useMemo(() => {
    const term = text.trim().toLowerCase();
    return (data ?? [])
      .filter((r) => !term || r.producto.toLowerCase().includes(term) || r.codigo.toLowerCase().includes(term))
      .filter((r) => !onlyLow || (r.stock_minimo > 0 && r.stock_actual <= r.stock_minimo))
      .map((r) => ({ ...r, key: r.id_inventario }));
  }, [data, text, onlyLow]);

  return (
    <>
      <PageHeader title="Inventario" subtitle="Stock por almacén." />
      <div className={styles.toolbar}>
        <input className={styles.input} type="search" placeholder="Buscar por nombre o código" value={text} onChange={(e) => setText(e.target.value)} />
        <label className={styles.check}>
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} /> Solo bajo stock
        </label>
      </div>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <DataTable
          rowKey="key"
          rows={rows}
          emptyTitle="Sin resultados"
          columns={[
            { key: 'codigo', header: 'Código' },
            { key: 'producto', header: 'Producto' },
            { key: 'almacen', header: 'Almacén' },
            { key: 'stock_actual', header: 'Stock', align: 'right' },
            { key: 'stock_minimo', header: 'Mínimo', align: 'right' },
            {
              key: 'estado',
              header: 'Estado',
              render: (r) => (r.stock_actual === 0 ? <Pill tone="danger">Agotado</Pill>
                : r.stock_minimo > 0 && r.stock_actual <= r.stock_minimo ? <Pill tone="warn">Reponer</Pill>
                : <Pill tone="ok">Normal</Pill>),
            },
          ]}
        />
      </AsyncView>
    </>
  );
}
