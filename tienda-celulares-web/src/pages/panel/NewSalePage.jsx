import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { lookupsApi, salesApi } from '../../api/panel/panelApi';
import { useAuth } from '../../auth/AuthContext';
import CartLine from '../../components/panel/CartLine';
import CustomerPicker from '../../components/panel/CustomerPicker';
import ProductPicker from '../../components/panel/ProductPicker';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { ROLES } from '../../config/panel';
import { useAsync } from '../../hooks/useAsync';
import { useCart } from '../../hooks/useCart';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatBs } from '../../utils/format';
import styles from './NewSalePage.module.css';

// Mismo tope que aplica la API a quien no es Administrador (las promociones vigentes lo superan solas).
const SELLER_MAX_DISCOUNT = 10;

export default function NewSalePage() {
  usePageTitle('Nueva venta');
  const { user } = useAuth();
  const cart = useCart();
  const order = useLocation().state?.order ?? null;
  const [customer, setCustomer] = useState(null);
  const [methodId, setMethodId] = useState('');
  const [invoice, setInvoice] = useState(false);
  const [credit, setCredit] = useState(false);
  const [advance, setAdvance] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [done, setDone] = useState(null);

  const lookups = useAsync(() => Promise.all([lookupsApi.paymentMethods(), lookupsApi.warehouses()]), []);
  const [methods, warehouses] = lookups.data ?? [[], []];
  // El mismo almacén que elegirá la API: el primero activo de la sucursal del empleado.
  const warehouse = warehouses.find((w) => w.id_sucursal === user.id_sucursal);
  const maxDiscount = user.rol === ROLES.admin ? 100 : SELLER_MAX_DISCOUNT;
  const canSubmit = customer && methodId && cart.ready && !busy;

  const submit = async () => {
    setBusy(true);
    setFailure('');
    try {
      const sale = await salesApi.create({
        id_cliente: customer.id_cliente,
        id_metodo_pago: Number(methodId),
        facturar: invoice,
        ...(credit ? { credito: { adelanto: Number(advance) || 0, vence: dueDate || undefined } } : {}),
        items: cart.toItems(),
      });
      setDone(sale);
    } catch (e) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  };

  const startOver = () => {
    cart.clear();
    setCustomer(null);
    setInvoice(false);
    setCredit(false);
    setAdvance('');
    setDueDate('');
    setDone(null);
  };

  if (done) {
    return (
      <div className={styles.done}>
        <h1>Venta registrada</h1>
        <p>
          N° {done.id_venta} · {done.cliente}
          {done.numero_factura && ` · Factura ${done.numero_factura}`}
        </p>
        <strong className={styles.doneTotal}>{formatBs(Number(done.total))}</strong>
        {done.saldo_credito > 0 && <p>Venta a crédito · saldo pendiente <strong>{formatBs(Number(done.saldo_credito))}</strong></p>}
        <div className={styles.doneActions}>
          <button type="button" className="button is-primary is-rounded" onClick={startOver}>Nueva venta</button>
          <Link className="button is-primary is-outlined is-rounded" to="/panel/ventas">Ver ventas</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Nueva venta" subtitle="Elige el cliente, agrega los productos y confirma." />
      {order && (
        <div className="notification is-info is-light">
          <strong>Pedido N° {order.id_pedido}</strong> de {order.nombre_cliente} ({order.telefono}{order.ci && `, CI ${order.ci}`}): {order.items.map((it) => `${it.cantidad} × ${it.producto}`).join(' · ')}.
          <br />Busca o registra al cliente y agrega estos productos. Cuando la venta esté hecha, marca el pedido como Entregado.
        </div>
      )}
      <AsyncView loading={lookups.loading} error={lookups.error} onRetry={lookups.reload}>
        <div className={styles.grid}>
          <div className={styles.col}>
            <section className={styles.block}>
              <h2>1. Cliente</h2>
              <CustomerPicker value={customer} onChange={setCustomer} />
            </section>

            <section className={styles.block}>
              <h2>2. Productos</h2>
              <ProductPicker onPick={cart.add} disabledIds={cart.lines.map((l) => l.producto.id_producto)} />
              <ul className={styles.lines}>
                {cart.lines.map((line) => (
                  <CartLine
                    key={line.producto.id_producto}
                    line={line}
                    warehouseId={warehouse?.id_almacen}
                    maxDiscount={maxDiscount}
                    onQuantity={(n) => cart.setQuantity(line.producto.id_producto, n)}
                    onImeis={(list) => cart.setImeis(line.producto.id_producto, list)}
                    onDiscount={(n) => cart.setDiscount(line.producto.id_producto, n)}
                    onRemove={() => cart.remove(line.producto.id_producto)}
                  />
                ))}
              </ul>
            </section>
          </div>

          <aside className={`${styles.block} ${styles.summary}`}>
            <h2>3. Pago</h2>
            <select className={styles.select} value={methodId} onChange={(e) => setMethodId(e.target.value)} aria-label="Método de pago">
              <option value="">Método de pago</option>
              {methods.map((m) => <option key={m.id_metodo_pago} value={m.id_metodo_pago}>{m.nombre}</option>)}
            </select>
            <label className={styles.check}>
              <input type="checkbox" checked={invoice} onChange={(e) => setInvoice(e.target.checked)} /> Emitir factura
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={credit} onChange={(e) => setCredit(e.target.checked)} /> Venta a crédito (queda saldo por cobrar)
            </label>
            {credit && (
              <div className="field">
                <input className="input" type="number" min="0" step="0.01" placeholder="Adelanto que paga hoy (Bs)" value={advance} onChange={(e) => setAdvance(e.target.value)} aria-label="Adelanto" />
                <input className="input mt-2" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Fecha límite de pago" />
                <p className="help">El adelanto entra a la caja con el método de pago elegido. Fecha límite opcional.</p>
              </div>
            )}
            <p className={styles.subtotal}>
              Subtotal <strong>{formatBs(cart.subtotal)}</strong>
            </p>
            <p className={styles.hint}>Las promociones vigentes se aplican solas al confirmar; el total final lo calcula el sistema.</p>
            {failure && <p className={styles.error} role="alert">{failure}</p>}
            <button type="button" className="button is-primary is-rounded" disabled={!canSubmit} onClick={submit}>
              {busy ? 'Registrando…' : 'Confirmar venta'}
            </button>
            {!canSubmit && !busy && (
              <p className={styles.hint}>Falta: {[!customer && 'cliente', !cart.ready && 'productos (y IMEI de los celulares)', !methodId && 'método de pago'].filter(Boolean).join(', ')}.</p>
            )}
          </aside>
        </div>
      </AsyncView>
    </>
  );
}
