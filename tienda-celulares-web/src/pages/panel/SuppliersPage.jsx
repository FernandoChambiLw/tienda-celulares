import { useState } from 'react';
import { suppliersApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import FormField from '../../components/panel/FormField';
import Modal from '../../components/panel/Modal';
import Pill from '../../components/panel/Pill';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';

const empty = { razon_social: '', nit: '', nombre_contacto: '', telefono: '', correo: '', direccion: '', tipo_proveedor: '', estado: 'Activo' };

function SupplierDialog({ supplier, onClose, onSaved }) {
  const [f, setF] = useState(supplier ? Object.fromEntries(Object.entries({ ...empty, ...supplier }).map(([k, v]) => [k, v ?? ''])) : empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    setBusy(true); setError('');
    const body = Object.fromEntries(Object.keys(empty).map((k) => [k, typeof f[k] === 'string' ? (f[k].trim() || null) : f[k]]));
    body.estado = f.estado;
    try { supplier ? await suppliersApi.update(supplier.id_proveedor, body) : await suppliersApi.create(body); onSaved(); } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <Modal title={supplier ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={onClose} onSubmit={save} busy={busy} error={error}>
      <div className="columns is-multiline">
        <div className="column is-8"><FormField label="Razón social" required value={f.razon_social} onChange={set('razon_social')} /></div>
        <div className="column is-4"><FormField label="NIT" required value={f.nit} onChange={set('nit')} /></div>
        <div className="column is-6"><FormField label="Contacto" value={f.nombre_contacto} onChange={set('nombre_contacto')} /></div>
        <div className="column is-6"><FormField label="Teléfono" value={f.telefono} onChange={set('telefono')} /></div>
        <div className="column is-6"><FormField label="Correo" value={f.correo} onChange={set('correo')} /></div>
        <div className="column is-6"><FormField label="Qué vende (celulares, accesorios…)" value={f.tipo_proveedor} onChange={set('tipo_proveedor')} /></div>
        <div className="column is-8"><FormField label="Dirección" value={f.direccion} onChange={set('direccion')} /></div>
        {supplier && <div className="column is-4"><FormField label="Estado" kind="select" required value={f.estado} onChange={set('estado')} options={['Activo', 'Inactivo']} /></div>}
      </div>
    </Modal>
  );
}

export default function SuppliersPage() {
  usePageTitle('Proveedores');
  const { data, loading, error, reload } = useAsync(() => suppliersApi.list(), []);
  const [editing, setEditing] = useState(undefined);
  const columns = [
    { key: 'razon_social', header: 'Proveedor', render: (r) => <strong>{r.razon_social}</strong> },
    { key: 'nit', header: 'NIT' },
    { key: 'nombre_contacto', header: 'Contacto', render: (r) => r.nombre_contacto ?? '—' },
    { key: 'telefono', header: 'Teléfono', render: (r) => r.telefono ?? '—' },
    { key: 'estado', header: 'Estado', render: (r) => <Pill tone={r.estado === 'Activo' ? 'ok' : 'neutral'}>{r.estado}</Pill> },
    { key: 'edit', header: '', render: (r) => <button type="button" className="button is-small is-primary is-outlined is-rounded" onClick={() => setEditing(r)}>Editar</button> },
  ];
  return (
    <>
      <PageHeader title="Proveedores" subtitle="A quién le compras la mercadería." />
      <p className="mb-3 no-print"><button type="button" className="button is-primary" onClick={() => setEditing(null)}>Nuevo proveedor</button></p>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <DataTable title="proveedores" rowKey="id_proveedor" rows={data ?? []} columns={columns} emptyTitle="Sin proveedores" emptyMessage="Registra a tu primer proveedor para poder cargar mercadería." />
      </AsyncView>
      {editing !== undefined && <SupplierDialog supplier={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />}
    </>
  );
}
