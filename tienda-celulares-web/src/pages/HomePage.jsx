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
  { type: 'Celular', title: 'Celulares', text: 'Equipos nuevos con garantía registrada por IMEI.', kind: 'phone', color: '#139069', tone: 'main' },
  { type: 'Accesorio', title: 'Accesorios', text: 'Fundas, cargadores y audífonos.', kind: 'headphones', color: '#1e2421', tone: 'sand' },
  { type: 'Dispositivo', title: 'Pulseras y relojes', text: 'Para medir tu día y tu ejercicio.', kind: 'band', color: '#c8541f', tone: 'amber' },
];

const STEPS = [
  { title: 'Elige', text: 'Mira el catálogo o cuéntanos qué necesitas y para qué lo vas a usar.' },
  { title: 'Pregunta', text: 'Te respondemos por WhatsApp o en la tienda, sin compromiso.' },
  { title: 'Llévalo con garantía', text: 'Cada celular sale con su garantía registrada y servicio técnico propio.' },
];

export default function HomePage() {
  usePageTitle('');
  const featured = useProducts(FEATURED_FILTERS);
  const whatsappLink = buildWhatsAppLink(site.whatsapp, 'Hola, quisiera información sobre sus productos.');

  return (
    <>
      <section className={`container ${styles.hero}`}>
        <div className={styles.heroText}>
          <span className="eyebrow">{site.address.split(',').pop().trim()} · Bolivia</span>
          <h1 className={styles.title}>
            Tu próximo celular, con gente que <em>te explica</em>.
          </h1>
          <p className={styles.lead}>
            Equipos nuevos con garantía, accesorios y reparación en el mismo lugar. Pasa por la
            tienda o escríbenos y te ayudamos a elegir sin apuro.
          </p>
          <div className={styles.actions}>
            <Link to="/catalogo" className="btn btn--primary">
              Ver catálogo
            </Link>
            <a className="btn btn--ghost" href={whatsappLink} target="_blank" rel="noopener noreferrer">
              Escribir por WhatsApp
            </a>
          </div>
        </div>
        <HeroArt />
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="types-title">
        <h2 id="types-title" className={styles.sectionTitle}>
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
        <div className={styles.sectionHead}>
          <h2 id="featured-title" className={styles.sectionTitle}>
            Celulares destacados
          </h2>
          <Link to="/catalogo?tipo=Celular" className={styles.more}>
            Ver todos →
          </Link>
        </div>
        <AsyncView loading={featured.loading} error={featured.error} onRetry={featured.reload}>
          {featured.data && <ProductGrid products={featured.data} />}
        </AsyncView>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="steps-title">
        <h2 id="steps-title" className={styles.sectionTitle}>
          Así te atendemos
        </h2>
        <ol className={styles.steps}>
          {STEPS.map(({ title, text }, index) => (
            <li key={title} className={styles.step}>
              <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.cta}>
          <div>
            <h2 className={styles.ctaTitle}>¿No sabes cuál elegir?</h2>
            <p className={styles.ctaText}>
              Cuéntanos tu presupuesto y qué usas más, y te recomendamos dos o tres opciones.
            </p>
          </div>
          <a className="btn btn--cream" href={whatsappLink} target="_blank" rel="noopener noreferrer">
            Hablar con la tienda
          </a>
        </div>
      </section>
    </>
  );
}
