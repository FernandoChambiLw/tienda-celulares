import { useState } from 'react';
import { customersApi } from '../../api/panel/panelApi';
import ClientDialog from '../../components/panel/ClientDialog';
import DataTable from '../../components/panel/DataTable';
import Pill from '../../components/panel/Pill';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { useAsync } from '../../hooks/useAsync';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function ClientsPage() {
  usePageTitle('Clientes');
  const [text, setText] = useState('');
  const term = useDebouncedValue(text.trim(), 300);
  const [editing, setEditing] = useState(undefined); // undefined = cerrado, null = nuevo, objeto = editar
  const { data, loading, error, reload } = useAsync(() => customersApi.list({ q: term, limit: 200 }), [term]);

  const columns = [
    { key: 'nombre', header: 'Cliente', render: (r) => <strong>{r.nombres} {r.apellido_paterno} {r.apellido_materno ?? ''}</strong> },
    { key: 'ci', header: 'CI' },
    { key: 'tel', header: 'Teléfono', render: (r) => r.telefonos?.[0]?.numero ?? '—' },
    { key: 'tipo_cliente', header: 'Tipo', render: (r) => (r.tipo_cliente === 'Juridica' ? `Empresa · NIT ${r.nit}` : 'Persona') },
    { key: 'estado', header: 'Estado', render: (r) => <Pill tone={r.estado === 'Activo' ? 'ok' : 'neutral'}>{r.estado}</Pill> },
    { key: 'edit', header: '', render: (r) => <button type="button" className="button is-small is-primary is-outlined is-rounded" onClick={() => setEditing(r)}>Editar</button> },
  ];

  return (
    <>
      <PageHeader title="Clientes" subtitle="Registra a quien te compra o deja un equipo en el taller." />
      <div className="field has-addons no-print">
        <div className="control is-expanded"><input className="input" type="search" placeholder="Buscar por nombre o CI" value={text} onChange={(e) => setText(e.target.value)} aria-label="Buscar cliente" /></div>
        <div className="control"><button type="button" className="button is-primary" onClick={() => setEditing(null)}>Nuevo cliente</button></div>
      </div>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <DataTable title="clientes" rowKey="id_cliente" rows={data ?? []} columns={columns} emptyTitle="Sin clientes" emptyMessage="Todavía no hay clientes con esta búsqueda. Usa «Nuevo cliente»." />
      </AsyncView>
      {editing !== undefined && <ClientDialog client={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />}
    </>
  );
}
