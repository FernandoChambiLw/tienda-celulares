import { useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import ProductImage from '../components/products/ProductImage';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import { MAX_PER_ITEM, useShopCart } from '../hooks/useShopCart';
import { usePageTitle } from '../hooks/usePageTitle';
import { site } from '../config/site';
import { formatBs } from '../utils/format';
import { buildWhatsAppLink } from '../utils/whatsapp';

// Mensaje que se envía a la tienda por WhatsApp con el pedido ya registrado.
function buildMessage(order, form) {
  const lines = order.items.map((it) => `• ${it.cantidad} × ${it.nombre} — ${formatBs(it.cantidad * it.precio_unitario)}`);
  return [
    `Hola, hice el pedido N° ${order.id_pedido} en la web.`,
    ...lines,
    `Total: ${formatBs(order.total)}`,
    `A nombre de: ${form.nombre} (${form.telefono})`,
  ].join('\n');
}

export default function CartPage() {
  usePageTitle('Mi carrito');
  const cart = useShopCart();
  const [form, setForm] = useState({ nombre: '', telefono: '', ci: '', notas: '' });
  const [state, setState] = useState({ busy: false, error: '', order: null, sent: null });
  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setState({ busy: true, error: '', order: null, sent: null });
    try {
      const order = await orderApi.create({ ...form, lines: cart.lines });
      // El resumen se conserva aparte porque el carrito se vacía al registrar el pedido.
      setState({ busy: false, error: '', order, sent: { ...form } });
      cart.clear();
    } catch (e) {
      setState({ busy: false, error: e.status ? e.message : 'No pudimos conectar con el servidor. Inténtalo de nuevo.', order: null, sent: null });
    }
  };

  if (state.order) {
    const { order, sent } = state;
    return (
      <div className="container">
        <div className="box has-text-centered py-6">
          <p className="tag is-success is-light is-medium is-rounded mb-3">Pedido registrado</p>
          <h1 className="title is-3">Tu pedido N° {order.id_pedido} está en camino a la tienda</h1>
          <p className="mb-2">Total: <strong>{formatBs(order.total)}</strong></p>
          <p className="has-text-grey mb-5">
            Para agilizar la atención, envíanos el pedido por WhatsApp. Te confirmaremos la disponibilidad y la forma de entrega.
          </p>
          <div className="buttons is-centered">
            <a
              className="button is-primary is-medium is-rounded"
              href={buildWhatsAppLink(site.whatsapp, buildMessage(order, sent))}
              target="_blank"
              rel="noopener noreferrer"
            >
              Enviar por WhatsApp
            </a>
            <Link to="/catalogo" className="button is-primary is-outlined is-medium is-rounded">
              Seguir viendo productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="container">
        <EmptyState title="Tu carrito está vacío" message="Agrega productos desde el catálogo para armar tu pedido.">
          <Link to="/catalogo" className="button is-primary is-rounded">Ir al catálogo</Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container">
      <PageHeader title="Mi carrito" subtitle="Revisa tu pedido y déjanos tus datos. Pagas y recoges (o coordinas la entrega) con la tienda." />

      <div className="columns is-variable is-6">
        <div className="column is-7">
          {cart.lines.map((line) => (
            <article key={line.id} className="box">
              <div className="columns is-mobile is-vcentered">
                <div className="column is-4-mobile is-3-tablet">
                  <ProductImage product={{ nombre: line.nombre, fotoUrl: line.fotoUrl, tipo: line.tipo, marca: line.marca, color: line.color }} />
                </div>
                <div className="column">
                  <p className="has-text-grey is-size-7 is-uppercase">{line.marca}</p>
                  <Link to={`/catalogo/${line.id}`} className="has-text-weight-bold">{line.nombre}</Link>
                  <p className="mt-1">{formatBs(line.precio)} c/u</p>
                  <div className="is-flex is-align-items-center mt-2" style={{ gap: 8 }}>
                    <button type="button" className="button is-small is-rounded" aria-label="Quitar una unidad" onClick={() => cart.setQuantity(line.id, line.cantidad - 1)} disabled={line.cantidad <= 1}>−</button>
                    <span aria-live="polite" style={{ minWidth: 24, textAlign: 'center' }}>{line.cantidad}</span>
                    <button type="button" className="button is-small is-rounded" aria-label="Agregar una unidad" onClick={() => cart.setQuantity(line.id, line.cantidad + 1)} disabled={line.cantidad >= MAX_PER_ITEM}>＋</button>
                    <button type="button" className="button is-small is-light is-rounded ml-3" onClick={() => cart.remove(line.id)}>Quitar</button>
                  </div>
                </div>
                <div className="column is-narrow has-text-right">
                  <strong>{formatBs(line.cantidad * line.precio)}</strong>
                </div>
              </div>
            </article>
          ))}
          <p className="title is-4 has-text-right">Total: {formatBs(cart.total)}</p>
          <p className="help has-text-right">Los precios se confirman al enviar el pedido.</p>
        </div>

        <div className="column is-5">
          <form className="box" onSubmit={submit}>
            <h2 className="title is-5">Tus datos</h2>
            <div className="field">
              <label className="label" htmlFor="ped-nombre">Nombre completo *</label>
              <input id="ped-nombre" className="input" required minLength={2} maxLength={100} value={form.nombre} onChange={update('nombre')} autoComplete="name" />
            </div>
            <div className="field">
              <label className="label" htmlFor="ped-tel">Teléfono / WhatsApp *</label>
              <input id="ped-tel" className="input" required inputMode="tel" value={form.telefono} onChange={update('telefono')} autoComplete="tel" placeholder="Ej: 71234567" />
            </div>
            <div className="field">
              <label className="label" htmlFor="ped-ci">Carnet de identidad</label>
              <input id="ped-ci" className="input" maxLength={20} value={form.ci} onChange={update('ci')} />
              <p className="help">Opcional. Sirve para registrar tu garantía.</p>
            </div>
            <div className="field">
              <label className="label" htmlFor="ped-notas">Notas</label>
              <textarea id="ped-notas" className="textarea" rows={2} maxLength={300} value={form.notas} onChange={update('notas')} placeholder="Color preferido, horario para recoger, etc." />
            </div>
            {state.error && <p className="notification is-danger is-light" role="alert">{state.error}</p>}
            <button type="submit" className={`button is-primary is-medium is-rounded is-fullwidth ${state.busy ? 'is-loading' : ''}`} disabled={state.busy}>
              Hacer pedido
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
