// Tabla de especificaciones con las clases `table` de Bulma.
export default function ProductSpecs({ specs }) {
  if (specs.length === 0) return null;

  return (
    <section aria-labelledby="specs-title">
      <h2 id="specs-title" className="title is-5">
        Especificaciones
      </h2>
      <div className="table-container">
        <table className="table is-fullwidth is-striped">
          <tbody>
            {specs.map(({ label, value }) => (
              <tr key={label}>
                <th scope="row" className="has-text-grey has-text-weight-normal" style={{ width: '35%' }}>
                  {label}
                </th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
