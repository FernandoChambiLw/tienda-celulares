import { Link } from 'react-router-dom';
import HeroArt from '../components/home/HeroArt';
import Illustration from '../components/products/Illustration';
import ProductGrid from '../components/products/ProductGrid';
import AsyncView from '../components/ui/AsyncView';
import { site } from '../config/site';
import { usePageTitle } from '../hooks/usePageTitle';
import { useProducts } from '../hooks/useProducts';
import { buildWhatsAppLink } from '../utils/whatsapp';
import styles from './HomePage.module.css';

const FEATURED_FILTERS = { tipo: 'Celular', orden: 'precio_desc', limite: 4 };

// Los tres accesos grandes por tipo de producto (coinciden con producto.tipo_producto).
const TILES = [
  { type: 'Celular', title: 'Celulares', text: 'Equipos nuevos con garantía registrada por IMEI.', kind: 'phone', color: '#0a6fdb', tone: 'main' },
  { type: 'Accesorio', title: 'Accesorios', text: 'Fundas, cargadores y audífonos.', kind: 'headphones', color: '#0b1220', tone: 'sand' },
  { type: 'Dispositivo', title: 'Pulseras y relojes', text: 'Para medir tu día y tu ejercicio.', kind: 'band', color: '#e8590c', tone: 'amber' },
];

const STEPS = [
  { title: 'Elige', text: 'Mira el catálogo, compara modelos o cuéntanos qué necesitas y para qué lo vas a usar.' },
  { title: 'Pregunta', text: 'Te respondemos por WhatsApp o en la tienda, sin compromiso.' },
  { title: 'Llévalo con garantía', text: 'Cada celular sale con su garantía registrada y servicio técnico propio.' },
];

export default function HomePage() {
  usePageTitle('');
  const featured = useProducts(FEATURED_FILTERS);
  const whatsappLink = buildWhatsAppLink(site.whatsapp, 'Hola, quisiera información sobre sus productos.');

  return (
    <>
      {/* Portada: componente `hero` de Bulma con fondo negro, como el logo. */}
      <section className={`hero ${styles.hero}`}>
        <div className="hero-body">
          <div className="container">
            <div className="columns is-vcentered is-variable is-8">
              <div className="column is-6">
                <span className="eyebrow">{site.name} · Bolivia</span>
                <h1 className={styles.title}>
                  Tu próximo celular, con gente que <em>te explica</em>.
                </h1>
                <p className={styles.lead}>
                  Equipos nuevos con garantía, accesorios y reparación en el mismo lugar. Pasa por la
                  tienda o escríbenos y te ayudamos a elegir sin apuro.
                </p>
                <div className="buttons mt-5">
                  <Link to="/catalogo" className="button is-primary is-medium is-rounded">
                    Ver catálogo
                  </Link>
                  <a className="button is-white is-outlined is-medium is-rounded" href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    Escribir por WhatsApp
                  </a>
                </div>
              </div>
              <div className="column is-6">
                <HeroArt />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="types-title">
        <h2 id="types-title" className="title is-3 mb-5">
          ¿Qué estás buscando?
        </h2>
        <ul className={styles.tiles}>
          {TILES.map(({ type, title, text, kind, color, tone }) => (
            <li key={type} className={`${styles.tile} ${styles[tone]}`}>
              <Link to={`/catalogo?tipo=${type}`} className={styles.tileLink}>
                <span className={styles.tileTitle}>{title}</span>
                <span className={styles.tileText}>{text}</span>
                <span className={styles.tileGo}>Ver →</span>
                <Illustration className={styles.tileArt} kind={kind} color={color} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="featured-title">
        <div className="is-flex is-justify-content-space-between is-align-items-baseline mb-5">
          <h2 id="featured-title" className="title is-3 mb-0">
            Celulares destacados
          </h2>
          <Link to="/catalogo?tipo=Celular" className="has-text-weight-bold">
            Ver todos →
          </Link>
        </div>
        <AsyncView loading={featured.loading} error={featured.error} onRetry={featured.reload}>
          {featured.data && <ProductGrid products={featured.data} />}
        </AsyncView>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="steps-title">
        <h2 id="steps-title" className="title is-3 mb-5">
          Así te atendemos
        </h2>
        <div className="columns">
          {STEPS.map(({ title, text }, index) => (
            <div key={title} className="column is-4">
              <div className={`box ${styles.step}`}>
                <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
                <h3 className="title is-5 mt-2 mb-2">{title}</h3>
                <p className="has-text-grey">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.cta}>
          <div>
            <h2 className={styles.ctaTitle}>¿No sabes cuál elegir?</h2>
            <p className={styles.ctaText}>
              Cuéntanos tu presupuesto y qué usas más, y te recomendamos dos o tres opciones.
            </p>
          </div>
          <a className="button is-white is-medium is-rounded" href={whatsappLink} target="_blank" rel="noopener noreferrer">
            Hablar con la tienda
          </a>
        </div>
      </section>
    </>
  );
}
