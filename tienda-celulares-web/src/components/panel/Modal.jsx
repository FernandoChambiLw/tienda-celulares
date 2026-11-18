// Ventana modal de Bulma reutilizable para los formularios del panel.
export default function Modal({ title, onClose, onSubmit, busy, submitLabel = 'Guardar', wide, children, error }) {
  return (
    <div className="modal is-active no-print" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-background" onClick={onClose} />
      <form className="modal-card" style={wide ? { width: 'min(860px, 96vw)' } : undefined} onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <header className="modal-card-head">
          <p className="modal-card-title">{title}</p>
          <button type="button" className="delete" aria-label="Cerrar" onClick={onClose} />
        </header>
        <section className="modal-card-body">
          {children}
          {error && <p className="notification is-danger is-light mt-3" role="alert">{error}</p>}
        </section>
        <footer className="modal-card-foot">
          <button type="submit" className={`button is-primary is-rounded ${busy ? 'is-loading' : ''}`} disabled={busy}>{submitLabel}</button>
          <button type="button" className="button is-rounded" onClick={onClose}>Cancelar</button>
        </footer>
      </form>
    </div>
  );
}
