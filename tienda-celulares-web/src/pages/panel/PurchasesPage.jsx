import { useState } from 'react';
import { lookupsApi, purchasesApi, suppliersApi } from '../../api/panel/panelApi';
import DataTable from '../../components/panel/DataTable';
import FormField from '../../components/panel/FormField';
import Modal from '../../components/panel/Modal';
import ProductPicker from '../../components/panel/ProductPicker';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatBs, formatDate } from '../../utils/format';

const parseImeis = (text) => text.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);

function NewPurchase({ onClose, onSaved }) {
  const suppliers = useAsync(() => suppliersApi.list(), []);
  const methods = useAsync(() => lookupsApi.paymentMethods(), []);
  const [head, setHead] = useState({ id_proveedor: '', numero_factura: '', id_metodo_pago: '' });
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const add = (p) => setLines((l) => [...l, { id: p.id_producto, nombre: p.nombre, tipo: p.tipo_producto, cantidad: 1, precio: p.precio_compra ?? 0, imeis: '' }]);
  const patch = (i, k, v) => setLines((l) => l.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const total = lines.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.precio) || 0), 0);

  const save = async () => {
    setError('');
    if (!lines.length) return setError('Agrega al menos un producto.');
    for (const l of lines) {
      if (l.tipo === 'Celular') {
        const n = parseImeis(l.imeis).length;
        if (n !== Number(l.cantidad)) return setError(`${l.nombre}: son ${l.cantidad} unidades pero escribiste ${n} IMEI.`);
      }
    }
    setBusy(true);
    try {
      await purchasesApi.create({
        id_proveedor: Number(head.id_proveedor), numero_factura: head.numero_factura.trim() || undefined,
        id_metodo_pago: head.id_metodo_pago ? Number(head.id_metodo_pago) : undefined,
        items: lines.map((l) => ({ id_producto: l.id, cantidad: Number(l.cantidad), precio_unitario: Number(l.precio), ...(l.tipo === 'Celular' ? { imeis: parseImeis(l.imeis) } : {}) })),
      });
      onSaved();
    } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <Modal wide title="Nueva compra (ingreso de mercadería)" onClose={onClose} onSubmit={save} busy={busy} error={error} submitLabel="Registrar compra">
      <div className="columns">
        <div className="column"><FormField label="Proveedor" kind="select" required value={head.id_proveedor} onChange={(v) => setHead({ ...head, id_proveedor: v })}
          options={(suppliers.data ?? []).filter((s) => s.estado === 'Activo').map((s) => ({ value: s.id_proveedor, label: s.razon_social }))} /></div>
        <div className="column"><FormField label="N° de factura o nota" value={head.numero_factura} onChange={(v) => setHead({ ...head, numero_factura: v })} /></div>
        <div className="column"><FormField label="Método de pago" kind="select" value={head.id_metodo_pago} onChange={(v) => setHead({ ...head, id_metodo_pago: v })}
          options={(methods.data ?? []).map((m) => ({ value: m.id_metodo_pago, label: m.nombre }))} /></div>
      </div>
      <ProductPicker anyStock onPick={add} disabledIds={lines.map((l) => l.id)} />
      {lines.map((l, i) => (
        <div key={l.id} className="box mt-3">
          <div className="columns is-vcentered is-mobile">
            <div className="column"><strong>{l.nombre}</strong> <span className="tag is-light">{l.tipo}</span></div>
            <div className="column is-narrow"><button type="button" className="delete" aria-label={`Quitar ${l.nombre}`} onClick={() => setLines((x) => x.filter((_, j) => j !== i))} /></div>
          </div>
          <div className="columns">
            <div className="column is-3"><FormField label="Cantidad" kind="number" min="1" required value={l.cantidad} onChange={(v) => patch(i, 'cantidad', v)} /></div>
            <div className="column is-3"><FormField label="Costo unitario (Bs)" kind="number" min="0" step="0.01" required value={l.precio} onChange={(v) => patch(i, 'precio', v)} /></div>
            <div className="column is-6 has-text-right"><p className="help">Subtotal</p><strong>{formatBs((Number(l.cantidad) || 0) * (Number(l.precio) || 0))}</strong></div>
          </div>
          {l.tipo === 'Celular' && (
            <FormField label={`IMEI de cada equipo (uno por línea; deben ser ${l.cantidad || 0})`} kind="textarea" required value={l.imeis} onChange={(v) => patch(i, 'imeis', v)} placeholder="356901000000001&#10;356901000000002" />
          )}
        </div>
      ))}
      {lines.length > 0 && <p className="title is-5 has-text-right mt-3">Total: {formatBs(total)}</p>}
    </Modal>
  );
}

export default function PurchasesPage() {
  usePageTitle('Compras');
  const { data, loading, error, reload } = useAsync(() => purchasesApi.list({ limit: 100 }), []);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState(null);
  const columns = [
    { key: 'id_compra', header: 'N°' },
    { key: 'fecha_compra', header: 'Fecha', render: (r) => formatDate(r.fecha_compra) },
    { key: 'proveedor', header: 'Proveedor' },
    { key: 'numero_factura', header: 'Factura', render: (r) => r.numero_factura ?? '—' },
    { key: 'total', header: 'Total', align: 'right', render: (r) => formatBs(Number(r.total)) },
    { key: 'ver', header: '', render: (r) => <button type="button" className="button is-small is-primary is-outlined is-rounded" onClick={async () => setDetail(await purchasesApi.get(r.id_compra))}>Ver</button> },
  ];
  return (
    <>
      <PageHeader title="Compras" subtitle="Cada compra a un proveedor suma al stock. Los celulares se registran con su IMEI." />
      <p className="mb-3 no-print"><button type="button" className="button is-primary" onClick={() => setCreating(true)}>Nueva compra</button></p>
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <DataTable title="compras" rowKey="id_compra" rows={data ?? []} columns={columns} emptyTitle="Sin compras" emptyMessage="Registra tu primera compra para cargar el stock inicial." />
      </AsyncView>
      {creating && <NewPurchase onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); }} />}
      {detail && (
        <div className="modal is-active" role="dialog" aria-modal="true">
          <div className="modal-background" onClick={() => setDetail(null)} />
          <div className="modal-card">
            <header className="modal-card-head"><p className="modal-card-title">Compra N° {detail.id_compra} · {detail.proveedor}</p><button type="button" className="delete" aria-label="Cerrar" onClick={() => setDetail(null)} /></header>
            <section className="modal-card-body">
              {detail.items.map((it) => (
                <p key={it.id_producto}><strong>{it.cantidad} × {it.producto}</strong> a {formatBs(Number(it.precio_unitario))}{it.imeis.length > 0 && <><br /><small className="has-text-grey">IMEI: {it.imeis.join(', ')}</small></>}</p>
              ))}
              <p className="mt-3"><strong>Total {formatBs(Number(detail.total))}</strong></p>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
