import { useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAdminApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import Pill from '../../components/panel/Pill';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { PRODUCT_STATES, PRODUCT_TYPES } from '../../config/productFields';
import { useAsync } from '../../hooks/useAsync';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatBs } from '../../utils/format';
import styles from './Panel.module.css';

const STATE_TONE = { Activo: 'ok', Inactivo: 'neutral', Descontinuado: 'danger' };

export default function ProductsAdminPage() {
  usePageTitle('Productos');
  const [text, setText] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('Activo');
  const q = useDebouncedValue(text.trim(), 300);
  const { data, loading, error, reload } = useAsync(
    () => productsAdminApi.list({ q, tipo, estado, limit: 200 }),
    [q, tipo, estado],
  );

  return (
    <>
      <PageHeader title="Productos" subtitle="El catálogo que ven tus clientes sale de aquí." />
      <div className={styles.toolbar}>
        <input className={styles.input} type="search" placeholder="Buscar por nombre o código" value={text} onChange={(e) => setText(e.target.value)} />
        <select className={styles.select} value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo">
          <option value="">Todos los tipos</option>
          {PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className={styles.select} value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado">
          {PRODUCT_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <Link className="btn btn--primary" to="/panel/productos/nuevo">Nuevo producto</Link>
      </div>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <DataTable
          rowKey="id_producto"
          rows={data ?? []}
          emptyTitle="Sin productos"
          emptyMessage="Prueba con otros filtros o crea uno nuevo."
          columns={[
            { key: 'codigo', header: 'Código' },
            { key: 'nombre', header: 'Producto' },
            { key: 'tipo_producto', header: 'Tipo' },
            { key: 'marca', header: 'Marca' },
            { key: 'precio_venta', header: 'Precio', align: 'right', render: (r) => formatBs(Number(r.precio_venta)) },
            { key: 'stock_total', header: 'Stock', align: 'right' },
            { key: 'estado', header: 'Estado', render: (r) => <Pill tone={STATE_TONE[r.estado]}>{r.estado}</Pill> },
            {
              key: 'editar',
              header: '',
              render: (r) => <Link className="btn btn--ghost btn--small" to={`/panel/productos/${r.id_producto}`}>Editar</Link>,
            },
          ]}
        />
      </AsyncView>
    </>
  );
}
