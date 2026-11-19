import { Link, useParams } from 'react-router-dom';
import PriceTag from '../components/products/PriceTag';
import ProductImage from '../components/products/ProductImage';
import ProductSpecs from '../components/products/ProductSpecs';
import RelatedProducts from '../components/products/RelatedProducts';
import StockBadge from '../components/products/StockBadge';
import AsyncView from '../components/ui/AsyncView';
import EmptyState from '../components/ui/EmptyState';
import { site } from '../config/site';
import { useCompare } from '../hooks/useCompare';
import { useShopCart } from '../hooks/useShopCart';
import { usePageTitle } from '../hooks/usePageTitle';
import { useProduct } from '../hooks/useProducts';
import { buildWhatsAppLink } from '../utils/whatsapp';

const warrantyText = (months) =>
  months > 0 ? `${months} ${months === 1 ? 'mes' : 'meses'} de garantía` : 'Sin garantía';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { data: product, loading, error, reload } = useProduct(id);
  const compare = useCompare();
  const cart = useShopCart();

  usePageTitle(product?.nombre);

  if (error?.status === 404) {
    return (
      <div className="container">
        <EmptyState title="Producto no encontrado" message="Puede que ya no esté disponible.">
          <Link to="/catalogo" className="button is-primary is-rounded">
            Volver al catálogo
          </Link>
        </EmptyState>
      </div>
    );
  }

  const chosen = product ? compare.has(product.id) : false;

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <ul>
          <li>
            <Link to="/">Inicio</Link>
          </li>
          <li>
            <Link to="/catalogo">Catálogo</Link>
          </li>
          <li className="is-active">
            <a href="#producto" aria-current="page" onClick={(event) => event.preventDefault()}>
              {product?.nombre ?? 'Producto'}
            </a>
          </li>
        </ul>
      </nav>

      <AsyncView loading={loading} error={error} onRetry={reload}>
        {product && (
          <div id="producto">
            <div className="columns is-variable is-6">
              <div className="column is-6">
                <div className="box p-2">
                  <ProductImage product={product} />
                </div>
              </div>

              <div className="column is-6">
                <p className="has-text-grey has-text-weight-medium">{product.marca}</p>
                <h1 className="title is-2 mt-1">{product.nombre}</h1>
                {product.descripcion && <p className="mb-4">{product.descripcion}</p>}

                <PriceTag product={product} large />

                <div className="tags mt-4">
                  <StockBadge available={product.disponible} />
                  <span className="tag is-info is-light is-rounded">{warrantyText(product.garantiaMeses)}</span>
                  <span className="tag is-light is-rounded">Código: {product.codigo}</span>
                </div>

                <div className="buttons mt-5">
                  <button
                    type="button"
                    className="button is-primary is-medium is-rounded"
                    onClick={() => cart.add(product)}
                    disabled={!product.disponible}
                  >
                    {cart.has(product.id) ? 'Agregar otra unidad' : 'Agregar al carrito'}
                  </button>
                  <a
                    className="button is-primary is-outlined is-medium is-rounded"
                    href={buildWhatsAppLink(
                      site.whatsapp,
                      `Hola, me interesa ${product.nombre} (código ${product.codigo}). ¿Está disponible?`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Consultar por WhatsApp
                  </a>
                  <button
                    type="button"
                    className="button is-primary is-outlined is-medium is-rounded"
                    onClick={() => compare.toggle(product.id)}
                    disabled={!chosen && compare.full}
                  >
                    {chosen ? '✓ En comparación' : 'Comparar'}
                  </button>
                </div>
              </div>
            </div>

            <ProductSpecs specs={product.specs} />
            <RelatedProducts product={product} />
          </div>
        )}
      </AsyncView>
    </div>
  );
}
