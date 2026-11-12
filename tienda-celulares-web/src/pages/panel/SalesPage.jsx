import { useState } from 'react';
import { Link } from 'react-router-dom';
import { salesApi } from '../../api/panel/panelApi';
import { useAuth } from '../../auth/AuthContext';
import DataTable from '../../components/panel/DataTable';
import Pill from '../../components/panel/Pill';
import SaleDetailDialog from '../../components/panel/SaleDetailDialog';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { ROLES } from '../../config/panel';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatBs } from '../../utils/format';
import { formatDateTime, saleTone } from '../../utils/panelFormat';
import styles from './Panel.module.css';

export default function SalesPage() {
  usePageTitle('Ventas');
  const { user } = useAuth();
  const [filters, setFilters] = useState({ desde: '', hasta: '', estado: '' });
  const [openId, setOpenId] = useState(null);
  const { data, loading, error, reload } = useAsync(() => salesApi.list(filters), [filters]);
  const set = (field) => (event) => setFilters((prev) => ({ ...prev, [field]: event.target.value }));

  const columns = [
    { key: 'id_venta', header: 'N°' },
    { key: 'fecha_hora', header: 'Fecha', render: (r) => formatDateTime(r.fecha_hora) },
    { key: 'cliente', header: 'Cliente' },
    ...(user.rol === ROLES.admin ? [{ key: 'vendedor', header: 'Vendedor' }] : []),
    { key: 'metodo_pago', header: 'Pago' },
    { key: 'total', header: 'Total', align: 'right', render: (r) => formatBs(Number(r.total)) },
    { key: 'estado', header: 'Estado', render: (r) => <Pill tone={saleTone(r.estado)}>{r.estado}</Pill> },
    {
      key: 'ver',
      header: '',
      render: (r) => (
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setOpenId(r.id_venta)}>Ver</button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Ventas" subtitle={user.rol === ROLES.seller ? 'Tus ventas registradas.' : 'Todas las ventas.'} />
      <div className={styles.toolbar}>
        <label className={styles.check}>Desde <input className={styles.select} type="date" value={filters.desde} onChange={set('desde')} /></label>
        <label className={styles.check}>Hasta <input className={styles.select} type="date" value={filters.hasta} onChange={set('hasta')} /></label>
        <select className={styles.select} value={filters.estado} onChange={set('estado')} aria-label="Estado">
          <option value="">Todos</option>
          <option>Completada</option>
          <option>Anulada</option>
        </select>
        <span className={styles.spacer} />
        <Link className="btn btn--primary" to="/panel/ventas/nueva">Nueva venta</Link>
      </div>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <DataTable rowKey="id_venta" rows={data ?? []} columns={columns} emptyTitle="Sin ventas" emptyMessage="No hay ventas con estos filtros." />
      </AsyncView>
      {openId && <SaleDetailDialog saleId={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
    </>
  );
}
