import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { staffApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import FormField from '../../components/panel/FormField';
import Modal from '../../components/panel/Modal';
import Pill from '../../components/panel/Pill';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import { roleLabel } from '../../config/panel';

const ROLE_OPTIONS = [
  { value: 'Vendedor', label: 'Vendedor (ventas, caja, clientes)' },
  { value: 'Tecnico', label: 'Técnico (reparaciones)' },
  { value: 'Almacenero', label: 'Almacenero (compras, inventario)' },
  { value: 'Administrador', label: 'Administrador (todo)' },
];
const emptyEmp = { nombres: '', apellido_paterno: '', apellido_materno: '', ci: '', telefono: '', correo: '', id_cargo: '', salario: '', estado: 'Activo' };

function EmployeeDialog({ employee, positions, onClose, onSaved }) {
  const [f, setF] = useState(employee ? Object.fromEntries(Object.entries({ ...emptyEmp, ...employee }).map(([k, v]) => [k, v ?? ''])) : emptyEmp);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    setBusy(true); setError('');
    const body = Object.fromEntries(Object.keys(emptyEmp).map((k) => [k, typeof f[k] === 'string' ? f[k].trim() : f[k]]));
    body.id_cargo = Number(f.id_cargo); body.salario = Number(f.salario) || 0;
    try { employee ? await staffApi.updateEmployee(employee.id_empleado, body) : await staffApi.createEmployee(body); onSaved(); } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <Modal title={employee ? 'Editar empleado' : 'Nuevo empleado'} onClose={onClose} onSubmit={save} busy={busy} error={error}>
      <div className="columns is-multiline">
        <div className="column is-6"><FormField label="Nombres" required value={f.nombres} onChange={set('nombres')} /></div>
        <div className="column is-6"><FormField label="Apellido paterno" required value={f.apellido_paterno} onChange={set('apellido_paterno')} /></div>
        <div className="column is-6"><FormField label="Apellido materno" value={f.apellido_materno} onChange={set('apellido_materno')} /></div>
        <div className="column is-6"><FormField label="CI" required value={f.ci} onChange={set('ci')} /></div>
        <div className="column is-6"><FormField label="Teléfono" value={f.telefono} onChange={set('telefono')} /></div>
        <div className="column is-6"><FormField label="Correo" value={f.correo} onChange={set('correo')} /></div>
        <div className="column is-6"><FormField label="Cargo" kind="select" required value={f.id_cargo} onChange={set('id_cargo')} options={positions.map((p) => ({ value: p.id_cargo, label: p.nombre_cargo }))} /></div>
        <div className="column is-3"><FormField label="Salario (Bs)" kind="number" min="0" value={f.salario} onChange={set('salario')} /></div>
        {employee && <div className="column is-3"><FormField label="Estado" kind="select" required value={f.estado} onChange={set('estado')} options={['Activo', 'Inactivo', 'Suspendido']} /></div>}
      </div>
      {employee && f.estado !== 'Activo' && <p className="help">Un empleado que no está Activo pierde el acceso al sistema de inmediato.</p>}
    </Modal>
  );
}

function AccessDialog({ employee, onClose, onSaved }) {
  const has = employee.tiene_usuario;
  const [f, setF] = useState({ username: '', rol: employee.rol ?? 'Vendedor', password: '', estado: employee.estado_usuario ?? 'Activo' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    setBusy(true); setError('');
    try {
      if (has) await staffApi.updateUser(employee.id_usuario, { rol: f.rol, estado: f.estado, ...(f.password ? { password: f.password } : {}) });
      else await staffApi.createUser({ username: f.username.trim(), password: f.password, rol: f.rol, id_empleado: employee.id_empleado });
      onSaved();
    } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <Modal title={`${has ? 'Acceso de' : 'Dar acceso a'} ${employee.nombres} ${employee.apellido_paterno}`} onClose={onClose} onSubmit={save} busy={busy} error={error}>
      {!has && <FormField label="Nombre de usuario" required value={f.username} onChange={set('username')} autoComplete="off" />}
      {has && <p className="mb-3">Usuario: <strong>{employee.username}</strong></p>}
      <FormField label="Rol" kind="select" required value={f.rol} onChange={set('rol')} options={ROLE_OPTIONS} />
      {has && <FormField label="Estado del acceso" kind="select" required value={f.estado} onChange={set('estado')} options={['Activo', 'Inactivo', 'Bloqueado']} />}
      <FormField label={has ? 'Nueva clave temporal (solo si quieres restablecerla)' : 'Clave temporal'} required={!has} value={f.password} onChange={set('password')} autoComplete="off" />
      <p className="help">Mínimo 8 caracteres. La persona deberá cambiarla la primera vez que entre. Dásela en persona, no por un chat grupal.</p>
    </Modal>
  );
}

export default function StaffPage() {
  usePageTitle('Personal');
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => staffApi.list(), []);
  const positions = useAsync(() => staffApi.positions(), []);
  const [emp, setEmp] = useState(undefined);
  const [access, setAccess] = useState(null);
  const columns = [
    { key: 'nombre', header: 'Empleado', render: (r) => <strong>{r.nombres} {r.apellido_paterno}</strong> },
    { key: 'nombre_cargo', header: 'Cargo' },
    { key: 'ci', header: 'CI' },
    { key: 'acceso', header: 'Acceso al sistema', render: (r) => (r.tiene_usuario
      ? <span>{r.username} · {roleLabel(r.rol)} <Pill tone={r.estado_usuario === 'Activo' ? 'ok' : 'danger'}>{r.estado_usuario}</Pill></span>
      : <span className="has-text-grey">Sin acceso</span>) },
    { key: 'estado', header: 'Estado', render: (r) => <Pill tone={r.estado === 'Activo' ? 'ok' : 'neutral'}>{r.estado}</Pill> },
    { key: 'acciones', header: '', render: (r) => (
      <div className="buttons are-small">
        <button type="button" className="button is-primary is-outlined is-rounded" onClick={() => setEmp(r)}>Editar</button>
        <button type="button" className="button is-link is-outlined is-rounded" onClick={() => setAccess(r)}>{r.tiene_usuario ? 'Acceso' : 'Dar acceso'}</button>
      </div>) },
  ];
  return (
    <>
      <PageHeader title="Personal" subtitle={`Empleados y sus accesos. Tú (${user.username}) eres administrador: protege tu clave.`} />
      <p className="mb-3 no-print"><button type="button" className="button is-primary" onClick={() => setEmp(null)}>Nuevo empleado</button></p>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <DataTable title="personal" rowKey="id_empleado" rows={data ?? []} columns={columns} emptyTitle="Sin empleados" emptyMessage="Registra a tu primer empleado." />
      </AsyncView>
      {emp !== undefined && <EmployeeDialog employee={emp} positions={positions.data ?? []} onClose={() => setEmp(undefined)} onSaved={() => { setEmp(undefined); reload(); }} />}
      {access && <AccessDialog employee={access} onClose={() => setAccess(null)} onSaved={() => { setAccess(null); reload(); }} />}
    </>
  );
}
