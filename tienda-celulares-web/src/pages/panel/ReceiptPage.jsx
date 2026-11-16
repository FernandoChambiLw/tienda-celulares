import { Link, useParams } from 'react-router-dom';
import { salesApi } from '../../api/panel/panelApi';
import AsyncView from '../../components/ui/AsyncView';
import { site } from '../../config/site';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatBs } from '../../utils/format';
import { formatDateTime } from '../../utils/panelFormat';
import styles from './ReceiptPage.module.css';

// Comprobante de venta (NO es una factura): se imprime o se guarda como PDF desde el navegador.
// Quita garantías repetidas (una por IMEI vendido del mismo modelo y con la misma fecha).
const uniqueWarranties = (list) => {
  const seen = new Set();
  return list.filter((g) => {
    const key = `${g.id_producto}-${g.fecha_fin}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function ReceiptPage() {
  const { id } = useParams();
  const { data: sale, loading, error, reload } = useAsync(() => salesApi.get(id), [id]);
  usePageTitle(`Comprobante venta ${id}`);

  const gross = sale ? sale.items.reduce((sum, it) => sum + Number(it.subtotal), 0) : 0;
  const discount = sale ? gross - Number(sale.total) : 0;

  return (
    <AsyncView loading={loading} error={error} onRetry={reload}>
      {sale && (
        <>
          <div className="buttons no-print">
            <button type="button" className="button is-primary is-rounded" onClick={() => window.print()}>Imprimir / Guardar PDF</button>
            <Link to="/panel/ventas" className="button is-light is-rounded">Volver a ventas</Link>
          </div>

          <article className={styles.paper}>
            <header className={styles.head}>
              <img src="/logo-192.png" alt="" width="56" height="56" className={styles.logo} />
              <div>
                <h1>{site.name}</h1>
                <p>{site.address}</p>
                <p>Tel. {site.phone}</p>
              </div>
              <div className={styles.num}>
                <strong>COMPROBANTE DE VENTA</strong>
                <span>N° {String(sale.id_venta).padStart(6, '0')}</span>
                {sale.estado === 'Anulada' && <b className={styles.void}>ANULADA</b>}
              </div>
            </header>

            <dl className={styles.meta}>
              <div><dt>Fecha</dt><dd>{formatDateTime(sale.fecha_hora)}</dd></div>
              <div><dt>Cliente</dt><dd>{sale.cliente}{sale.cliente_ci && ` · CI ${sale.cliente_ci}`}</dd></div>
              <div><dt>Atendido por</dt><dd>{sale.vendedor}</dd></div>
              <div><dt>Forma de pago</dt><dd>{sale.metodo_pago}</dd></div>
            </dl>

            <table className={styles.items}>
              <thead>
                <tr><th>Cant.</th><th>Descripción</th><th className={styles.r}>P. unit.</th><th className={styles.r}>Subtotal</th></tr>
              </thead>
              <tbody>
                {sale.items.map((it) => (
                  <tr key={it.id_producto}>
                    <td>{it.cantidad}</td>
                    <td>
                      {it.producto}
                      {it.imeis.length > 0 && <small>IMEI: {it.imeis.join(', ')}</small>}
                    </td>
                    <td className={styles.r}>{formatBs(Number(it.precio_unitario))}</td>
                    <td className={styles.r}>{formatBs(Number(it.subtotal))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {discount > 0.005 && (
                  <>
                    <tr><td colSpan={3} className={styles.r}>Subtotal</td><td className={styles.r}>{formatBs(gross)}</td></tr>
                    <tr><td colSpan={3} className={styles.r}>Descuento</td><td className={styles.r}>- {formatBs(discount)}</td></tr>
                  </>
                )}
                <tr><td colSpan={3} className={styles.r}><strong>TOTAL</strong></td><td className={styles.r}><strong>{formatBs(Number(sale.total))}</strong></td></tr>
              </tfoot>
            </table>

            {sale.garantias?.length > 0 && (
              <section className={styles.warranty}>
                <h2>Garantía</h2>
                <ul>
                  {uniqueWarranties(sale.garantias).map((g) => (
                    <li key={g.id_garantia}>{sale.items.find((it) => it.id_producto === g.id_producto)?.producto ?? 'Producto'}: vigente hasta {g.fecha_fin?.slice(0, 10).split('-').reverse().join('/')}</li>
                  ))}
                </ul>
                <p>La garantía cubre defectos de fábrica. No cubre golpes, humedad ni mal uso. Conserve este comprobante.</p>
              </section>
            )}

            <footer className={styles.foot}>Documento sin valor tributario. Gracias por su compra.</footer>
          </article>
        </>
      )}
    </AsyncView>
  );
}
