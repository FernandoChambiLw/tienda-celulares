import { useState } from 'react';
import { auditApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { useAsync } from '../../hooks/useAsync';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDateTime } from '../../utils/panelFormat';

export default function AuditPage() {
  usePageTitle('Bitácora');
  const [accion, setAccion] = useState('');
  const [usuario, setUsuario] = useState('');
  const a = useDebouncedValue(accion.trim(), 300);
  const u = useDebouncedValue(usuario.trim(), 300);
  const { data, loading, error, reload } = useAsync(() => auditApi.list({ accion: a, usuario: u, limit: 200 }), [a, u]);
  const columns = [
    { key: 'fecha_hora', header: 'Fecha', render: (r) => formatDateTime(r.fecha_hora) },
    { key: 'usuario', header: 'Usuario', render: (r) => r.usuario ?? '—' },
    { key: 'accion', header: 'Acción' },
    { key: 'entidad', header: 'Sobre', render: (r) => `${r.entidad}${r.id_entidad ? ` N° ${r.id_entidad}` : ''}` },
    { key: 'detalle', header: 'Detalle', render: (r) => r.detalle ?? '' },
  ];
  return (
    <>
      <PageHeader title="Bitácora" subtitle="Quién hizo qué y cuándo: anulaciones, cambios de precio, cajas, abonos y pedidos." />
      <div className="field is-grouped">
        <div className="control"><input className="input" placeholder="Filtrar por acción" value={accion} onChange={(e) => setAccion(e.target.value)} aria-label="Acción" /></div>
        <div className="control"><input className="input" placeholder="Filtrar por usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} aria-label="Usuario" /></div>
      </div>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <DataTable title="bitacora" rowKey="id_bitacora" rows={data ?? []} columns={columns} emptyTitle="Sin registros" emptyMessage="No hay acciones con este filtro." />
      </AsyncView>
    </>
  );
}
