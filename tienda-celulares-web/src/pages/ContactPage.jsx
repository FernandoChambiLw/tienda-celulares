import PageHeader from '../components/ui/PageHeader';
import { site } from '../config/site';
import { usePageTitle } from '../hooks/usePageTitle';
import { buildWhatsAppLink } from '../utils/whatsapp';

const CONTACT_ITEMS = [
  { label: 'Dirección', value: site.address },
  { label: 'Horario de atención', value: site.schedule },
  { label: 'WhatsApp y teléfono', value: site.phone },
  ...(site.email ? [{ label: 'Correo', value: site.email }] : []),
];

export default function ContactPage() {
  usePageTitle('Contacto');

  return (
    <div className="container">
      <PageHeader title="Contacto" subtitle="Visítanos o escríbenos, te respondemos pronto." />

      <div className="columns is-multiline">
        {CONTACT_ITEMS.map(({ label, value }) => (
          <div key={label} className="column is-6">
            <div className="box">
              <p className="has-text-grey is-size-7 has-text-weight-semibold">{label}</p>
              <p className="is-size-5 has-text-weight-semibold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <a
        className="button is-primary is-medium is-rounded"
        href={buildWhatsAppLink(site.whatsapp, 'Hola, quisiera hacer una consulta.')}
        target="_blank"
        rel="noopener noreferrer"
      >
        Escribir por WhatsApp
      </a>
    </div>
  );
}
