export default function EmptyState({ title, message, children }) {
  return (
    <div className="box has-text-centered py-6">
      <h2 className="title is-5 mb-2">{title}</h2>
      {message && <p className="has-text-grey mb-4">{message}</p>}
      {children}
    </div>
  );
}
