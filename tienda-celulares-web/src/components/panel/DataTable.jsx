import { useMemo, useState } from 'react';
import EmptyState from '../ui/EmptyState';
import Pagination from '../ui/Pagination';
import styles from './DataTable.module.css';

// Texto plano de una celda (para buscar y exportar): si `render` devuelve un texto se usa ese,
// si devuelve un elemento de React se usa el dato crudo de la fila.
function cellText(col, row) {
  const rendered = col.render ? col.render(row) : row[col.key];
  const value = typeof rendered === 'string' || typeof rendered === 'number' ? rendered : row[col.key];
  return value === null || value === undefined ? '' : String(value);
}

const csvEscape = (text) => `"${text.replaceAll('"', '""')}"`;

function downloadCsv(name, columns, rows) {
  const exportable = columns.filter((c) => c.header);
  const lines = [
    exportable.map((c) => csvEscape(c.header)).join(','),
    ...rows.map((row) => exportable.map((c) => csvEscape(cellText(c, row))).join(',')),
  ];
  // El BOM inicial hace que Excel respete las tildes.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Tabla con las clases `table` de Bulma, más buscador, paginación, exportar a CSV e imprimir/PDF.
// columns: [{ key, header, render?(row), align? }]. Con `compact` se ocultan las herramientas (tablas chicas).
export default function DataTable({
  columns,
  rows,
  rowKey,
  title = 'tabla',
  compact = false,
  pageSize = 10,
  emptyTitle = 'Sin resultados',
  emptyMessage,
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => columns.some((col) => cellText(col, row).toLowerCase().includes(needle)));
  }, [rows, columns, search]);

  if (!rows.length) return <EmptyState title={emptyTitle} message={emptyMessage} />;

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = compact ? filtered : filtered.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div>
      {!compact && (
        <div className={`${styles.tools} no-print`}>
          <input
            type="search"
            className="input"
            placeholder="Buscar en la tabla…"
            aria-label="Buscar en la tabla"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <div className="buttons">
            <button type="button" className="button is-small is-primary is-outlined" onClick={() => downloadCsv(title, columns, filtered)}>
              Exportar CSV
            </button>
            <button type="button" className="button is-small is-primary is-outlined" onClick={() => window.print()}>
              Imprimir / PDF
            </button>
          </div>
        </div>
      )}

      <div className={`table-container ${styles.wrap}`}>
        <table className="table is-fullwidth is-hoverable">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.align === 'right' ? 'has-text-right' : undefined}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row[rowKey]}>
                {columns.map((col) => (
                  <td key={col.key} className={col.align === 'right' ? 'has-text-right' : undefined}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="has-text-centered has-text-grey">
                  Ninguna fila coincide con «{search}».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!compact && <Pagination page={current} pages={pages} onChange={setPage} />}
      {!compact && (
        <p className="help mt-2 no-print">
          {filtered.length} de {rows.length} {rows.length === 1 ? 'registro' : 'registros'}
        </p>
      )}
    </div>
  );
}
