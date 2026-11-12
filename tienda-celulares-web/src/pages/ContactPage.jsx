import PageHeader from '../components/ui/PageHeader';
import { site } from '../config/site';
import { usePageTitle } from '../hooks/usePageTitle';
import { buildWhatsAppLink } from '../utils/whatsapp';
import styles from './ContactPage.module.css';

const CONTACT_ITEMS = [
  { label: 'Dirección', value: site.address },
  { label: 'Horario de atención', value: site.schedule },
  { label: 'Teléfono', value: site.phone },
  { label: 'Correo', value: site.email },
];

export default function ContactPage() {
  usePageTitle('Contacto');

  return (
    <div className="container">
      <PageHeader title="Contacto" subtitle="Visítanos o escríbenos, te respondemos pronto." />

      <ul className={styles.grid}>
        {CONTACT_ITEMS.map(({ label, value }) => (
          <li key={label} className={styles.item}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
          </li>
        ))}
      </ul>

      <a
        className="btn btn--primary"
        href={buildWhatsAppLink(site.whatsapp, 'Hola, quisiera hacer una consulta.')}
        target="_blank"
        rel="noopener noreferrer"
      >
        Escribir por WhatsApp
      </a>
    </div>
  );
}
