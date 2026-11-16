import { useId } from 'react';

// Un campo de formulario con los componentes `field`, `label`, `control`, `input`, `select`
// y `textarea` de Bulma. kind: text | number | bool | select | textarea
// `options` puede ser ['a','b'] o [{ value, label }].
export default function FormField({ label, kind = 'text', value, onChange, options, required, ...rest }) {
  const id = useId();

  if (kind === 'bool') {
    return (
      <div className="field">
        <label className="checkbox has-text-weight-semibold">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> {label}
        </label>
      </div>
    );
  }

  const shared = { id, value, required, onChange: (e) => onChange(e.target.value) };
  let control;
  if (kind === 'select') {
    control = (
      <div className="select is-fullwidth">
        <select {...shared} {...rest}>
          <option value="">{required ? 'Elegir…' : '—'}</option>
          {options.map((o) => {
            const { value: v, label: l } = typeof o === 'string' ? { value: o, label: o } : o;
            return <option key={v} value={v}>{l}</option>;
          })}
        </select>
      </div>
    );
  } else if (kind === 'textarea') {
    control = <textarea className="textarea" rows={3} maxLength={300} {...shared} {...rest} />;
  } else {
    control = <input className="input" type={kind === 'number' ? 'number' : 'text'} {...shared} {...rest} />;
  }

  return (
    <div className="field">
      <label className="label is-small" htmlFor={id}>{label}{required && ' *'}</label>
      <div className="control">{control}</div>
    </div>
  );
}
