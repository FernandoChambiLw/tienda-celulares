import { useId } from 'react';
import styles from './FormField.module.css';

// Un campo de formulario con su etiqueta. kind: text | number | bool | select | textarea
// `options` puede ser ['a','b'] o [{ value, label }].
export default function FormField({ label, kind = 'text', value, onChange, options, required, ...rest }) {
  const id = useId();

  if (kind === 'bool') {
    return (
      <label className={styles.bool}>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> {label}
      </label>
    );
  }

  const shared = { id, value, required, className: styles.control, onChange: (e) => onChange(e.target.value) };
  let control;
  if (kind === 'select') {
    control = (
      <select {...shared} {...rest}>
        <option value="">{required ? 'Elegir…' : '—'}</option>
        {options.map((o) => {
          const { value: v, label: l } = typeof o === 'string' ? { value: o, label: o } : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    );
  } else if (kind === 'textarea') {
    control = <textarea rows={3} maxLength={300} {...shared} {...rest} />;
  } else {
    control = <input type={kind === 'number' ? 'number' : 'text'} {...shared} {...rest} />;
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}{required && ' *'}</label>
      {control}
    </div>
  );
}
