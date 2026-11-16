import { Link } from 'react-router-dom';
import { productsApi } from '../api/productsApi';
import PriceTag from '../components/products/PriceTag';
import ProductImage from '../components/products/ProductImage';
import StockBadge from '../components/products/StockBadge';
import AsyncView from '../components/ui/AsyncView';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import { useAsync } from '../hooks/useAsync';
import { useCompare } from '../hooks/useCompare';
import { usePageTitle } from '../hooks/usePageTitle';

const warranty = (months) => (months > 0 ? `${months} meses` : 'Sin garantía');

export default function ComparePage() {
  usePageTitle('Comparar productos');
  const compare = useCompare();
  const key = compare.ids.join(',');

  // Se piden los productos completos (con sus especificaciones) de los elegidos.
  const { data, loading, error, reload } = useAsync(async () => {
    const found = await Promise.all(compare.ids.map((id) => productsApi.getById(id).catch(() => null)));
    return found.filter(Boolean);
  }, [key]);

  if (compare.ids.length === 0) {
    return (
      <div className="container">
        <EmptyState
          title="Todavía no elegiste productos"
          message="En el catálogo pulsa «Comparar» en hasta 3 productos para verlos lado a lado."
        >
          <Link to="/catalogo" className="button is-primary is-rounded">
            Ir al catálogo
          </Link>
        </EmptyState>
      </div>
    );
  }

  // Todas las especificaciones que aparecen en algún producto, sin repetir etiquetas.
  const labels = [];
  (data ?? []).forEach((p) => p.specs.forEach((s) => !labels.includes(s.label) && labels.push(s.label)));

  return (
    <div className="container">
      <PageHeader title="Comparar productos" subtitle="Hasta 3 productos lado a lado." />

      <AsyncView loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <div className="table-container">
              <table className="table is-fullwidth is-bordered">
                <thead>
                  <tr>
                    <th scope="col" />
                    {data.map((p) => (
                      <th key={p.id} scope="col" style={{ minWidth: 200 }}>
                        <div style={{ maxWidth: 200 }}>
                          <ProductImage product={p} />
                        </div>
                        <Link to={`/catalogo/${p.id}`} className="is-block mt-2">
                          {p.nombre}
                        </Link>
                        <button type="button" className="button is-small is-light is-rounded mt-2 no-print" onClick={() => compare.remove(p.id)}>
                          Quitar
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Marca</th>
                    {data.map((p) => <td key={p.id}>{p.marca}</td>)}
                  </tr>
                  <tr>
                    <th scope="row">Precio</th>
                    {data.map((p) => <td key={p.id}><PriceTag product={p} /></td>)}
                  </tr>
                  <tr>
                    <th scope="row">Disponibilidad</th>
                    {data.map((p) => <td key={p.id}><StockBadge available={p.disponible} /></td>)}
                  </tr>
                  <tr>
                    <th scope="row">Garantía</th>
                    {data.map((p) => <td key={p.id}>{warranty(p.garantiaMeses)}</td>)}
                  </tr>
                  {labels.map((label) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      {data.map((p) => <td key={p.id}>{p.specs.find((s) => s.label === label)?.value ?? '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="buttons no-print">
              <Link to="/catalogo" className="button is-primary is-outlined is-rounded">
                Agregar más productos
              </Link>
              <button type="button" className="button is-light is-rounded" onClick={compare.clear}>
                Vaciar comparación
              </button>
            </div>
          </>
        )}
      </AsyncView>
    </div>
  );
}
