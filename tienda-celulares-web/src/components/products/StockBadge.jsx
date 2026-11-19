export default function StockBadge({ available }) {
  return (
    <span className={`tag ${available ? 'is-success is-light' : 'is-danger is-light'}`}>
      {available ? 'Disponible' : 'Agotado'}
    </span>
  );
}
