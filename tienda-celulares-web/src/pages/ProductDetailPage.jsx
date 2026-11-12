import { Link, useParams } from 'react-router-dom';
import PriceTag from '../components/products/PriceTag';
import ProductImage from '../components/products/ProductImage';
import ProductSpecs from '../components/products/ProductSpecs';
import StockBadge from '../components/products/StockBadge';
import AsyncView from '../components/ui/AsyncView';
import EmptyState from '../components/ui/EmptyState';
import { site } from '../config/site';
import { usePageTitle } from '../hooks/usePageTitle';
import { useProduct } from '../hooks/useProducts';
import { buildWhatsAppLink } from '../utils/whatsapp';
import styles from './ProductDetailPage.module.css';

const warrantyText = (months) =>
  months > 0 ? `${months} ${months === 1 ? 'mes' : 'meses'} de garantía` : 'Sin garantía';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { data: product, loading, error, reload } = useProduct(id);

  usePageTitle(product?.nombre);

  if (error?.status === 404) {
    return (
      <div className="container">
        <EmptyState title="Producto no encontrado" message="Puede que ya no esté disponible.">
          <Link to="/catalogo" className="btn btn--primary">
            Volver al catálogo
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/catalogo" className={styles.back}>
        ← Volver al catálogo
      </Link>

      <AsyncView loading={loading} error={error} onRetry={reload}>
        {product && (
          <div className={styles.layout}>
            <div className={styles.image}>
              <ProductImage product={product} />
            </div>

            <div className={styles.info}>
              <span className={styles.brand}>{product.marca}</span>
              <h1 className={styles.name}>{product.nombre}</h1>
              {product.descripcion && <p className={styles.description}>{product.descripcion}</p>}

              <PriceTag product={product} large />

              <ul className={styles.facts}>
                <li>
                  <StockBadge available={product.disponible} />
                </li>
                <li>{warrantyText(product.garantiaMeses)}</li>
                <li>Código: {product.codigo}</li>
              </ul>

              <a
                className="btn btn--primary"
                href={buildWhatsAppLink(
                  site.whatsapp,
                  `Hola, me interesa ${product.nombre} (código ${product.codigo}). ¿Está disponible?`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Consultar por WhatsApp
              </a>
            </div>

            <div className={styles.specs}>
              <ProductSpecs specs={product.specs} />
            </div>
          </div>
        )}
      </AsyncView>
    </div>
  );
}
