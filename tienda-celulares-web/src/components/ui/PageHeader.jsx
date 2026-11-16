// Encabezado de página con las clases `title` y `subtitle` de Bulma.
export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-5">
      <h1 className="title is-3 mb-2">{title}</h1>
      {subtitle && <p className="subtitle is-6">{subtitle}</p>}
      {children}
    </header>
  );
}
