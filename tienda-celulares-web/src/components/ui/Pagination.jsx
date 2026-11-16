// Paginación con el componente `pagination` de Bulma.
// Muestra la primera, la última y las páginas cercanas a la actual.
export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  const shown = [];
  for (let p = 1; p <= pages; p += 1) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) shown.push(p);
  }

  const items = [];
  shown.forEach((p, i) => {
    if (i > 0 && p - shown[i - 1] > 1) items.push(`gap-${p}`);
    items.push(p);
  });

  return (
    <nav className="pagination is-centered mt-5 no-print" role="navigation" aria-label="Paginación">
      <button type="button" className="pagination-previous" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <button type="button" className="pagination-next" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Siguiente
      </button>
      <ul className="pagination-list">
        {items.map((item) =>
          typeof item === 'string' ? (
            <li key={item}>
              <span className="pagination-ellipsis">&hellip;</span>
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={`pagination-link ${item === page ? 'is-current' : ''}`}
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onChange(item)}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
