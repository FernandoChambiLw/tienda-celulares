import EmptyState from '../ui/EmptyState';
import styles from './DataTable.module.css';

// columns: [{ key, header, render?(row), align? }]. Si no hay filas muestra un aviso.
export default function DataTable({ columns, rows, rowKey, emptyTitle = 'Sin resultados', emptyMessage }) {
  if (!rows.length) return <EmptyState title={emptyTitle} message={emptyMessage} />;

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.align === 'right' ? styles.right : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]}>
              {columns.map((col) => (
                <td key={col.key} className={col.align === 'right' ? styles.right : undefined}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
