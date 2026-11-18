import { useState } from 'react';
import { customersApi } from '../../api/panel/panelApi';
import FormField from './FormField';
import Modal from './Modal';

const empty = { nombres: '', apellido_paterno: '', apellido_materno: '', ci: '', tipo_cliente: 'Natural', nit: '', razon_social: '', correo: '', direccion: '', telefono: '', estado: 'Activo' };

// Alta / edición de un cliente. Con `client` edita; sin él crea. Devuelve el cliente guardado en onSaved.
export default function ClientDialog({ client, onClose, onSaved }) {
  const [f, setF] = useState(() => (client
    ? { ...empty, ...Object.fromEntries(Object.entries(client).map(([k, v]) => [k, v ?? ''])), telefono: client.telefonos?.[0]?.numero ?? '' }
    : empty));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const juridica = f.tipo_cliente === 'Juridica';

  const save = async () => {
    setBusy(true);
    setError('');
    const body = {
      nombres: f.nombres.trim(), apellido_paterno: f.apellido_paterno.trim(), apellido_materno: f.apellido_materno.trim() || null,
      ci: f.ci.trim(), tipo_cliente: f.tipo_cliente, nit: juridica ? f.nit.trim() : null, razon_social: juridica ? f.razon_social.trim() : null,
      correo: f.correo.trim() || null, direccion: f.direccion.trim() || null, estado: f.estado,
    };
    // Se conserva cualquier teléfono adicional que el cliente ya tuviera.
    const rest = (client?.telefonos ?? []).slice(1).map((t) => ({ numero: t.numero, tipo: t.tipo }));
    body.telefonos = [...(f.telefono.trim() ? [{ numero: f.telefono.trim(), tipo: 'WhatsApp' }] : []), ...rest];
    try {
      const saved = client ? await customersApi.update(client.id_cliente, body) : await customersApi.create(body);
      onSaved(saved);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={client ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose} onSubmit={save} busy={busy} error={error}>
      <div className="columns is-multiline">
        <div className="column is-6"><FormField label="Nombres" required value={f.nombres} onChange={set('nombres')} /></div>
        <div className="column is-6"><FormField label="Apellido paterno" required value={f.apellido_paterno} onChange={set('apellido_paterno')} /></div>
        <div className="column is-6"><FormField label="Apellido materno" value={f.apellido_materno} onChange={set('apellido_materno')} /></div>
        <div className="column is-6"><FormField label="Carnet de identidad (CI)" required value={f.ci} onChange={set('ci')} /></div>
        <div className="column is-6"><FormField label="Teléfono / WhatsApp" value={f.telefono} onChange={set('telefono')} inputMode="tel" /></div>
        <div className="column is-6"><FormField label="Correo" value={f.correo} onChange={set('correo')} /></div>
        <div className="column is-12"><FormField label="Dirección" value={f.direccion} onChange={set('direccion')} /></div>
        <div className="column is-4"><FormField label="Tipo" kind="select" required value={f.tipo_cliente} onChange={set('tipo_cliente')} options={[{ value: 'Natural', label: 'Persona' }, { value: 'Juridica', label: 'Empresa' }]} /></div>
        {juridica && <div className="column is-4"><FormField label="NIT" required value={f.nit} onChange={set('nit')} /></div>}
        {juridica && <div className="column is-4"><FormField label="Razón social" required value={f.razon_social} onChange={set('razon_social')} /></div>}
        {client && <div className="column is-4"><FormField label="Estado" kind="select" required value={f.estado} onChange={set('estado')} options={['Activo', 'Inactivo']} /></div>}
      </div>
    </Modal>
  );
}
