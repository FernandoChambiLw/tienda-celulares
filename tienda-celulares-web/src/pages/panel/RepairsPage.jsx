import { useState } from 'react';
import { repairsApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import Pill from '../../components/panel/Pill';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../auth/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatBs } from '../../utils/format';
import { REPAIR_STATES, repairTone } from '../../utils/panelFormat';
import styles from './Panel.module.css';

export default function RepairsPage() {
  usePageTitle('Reparaciones');
  const { user } = useAuth();
  const [estado, setEstado] = useState('');
  const { data, loading, error, reload } = useAsync(() => repairsApi.list({ estado }), [estado]);

  return (
    <>
      <PageHeader
        title="Reparaciones"
        subtitle={user.rol === 'Tecnico' ? 'Los equipos que tienes asignados.' : 'Todos los equipos en el taller.'}
      />
      <div className={styles.toolbar}>
        <select className={styles.select} value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado">
          <option value="">Todos los estados</option>
          {REPAIR_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <DataTable
          rowKey="id_reparacion"
          rows={data ?? []}
          emptyTitle="Sin reparaciones"
          emptyMessage="No hay equipos con ese estado."
          columns={[
            { key: 'id_reparacion', header: 'N°' },
            { key: 'fecha_ingreso', header: 'Ingreso', render: (r) => r.fecha_ingreso.slice(0, 10) },
            { key: 'cliente', header: 'Cliente' },
            { key: 'modelo', header: 'Equipo', render: (r) => r.modelo ?? '—' },
            { key: 'falla_reportada', header: 'Falla' },
            { key: 'tecnico', header: 'Técnico' },
            { key: 'estado', header: 'Estado', render: (r) => <Pill tone={repairTone(r.estado)}>{r.estado}</Pill> },
            { key: 'a_cobrar', header: 'A cobrar', align: 'right', render: (r) => formatBs(Number(r.a_cobrar)) },
          ]}
        />
      </AsyncView>
    </>
  );
}
