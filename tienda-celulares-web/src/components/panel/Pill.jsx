const TONES = { ok: 'is-success is-light', warn: 'is-warning is-light', danger: 'is-danger is-light', neutral: 'is-light' };

// Etiqueta de estado (`tag` de Bulma). tone: ok | warn | danger | neutral
export default function Pill({ tone = 'neutral', children }) {
  return <span className={`tag is-rounded ${TONES[tone] ?? TONES.neutral}`}>{children}</span>;
}
