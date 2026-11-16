import { useId } from 'react';

// Lista desplegable con los componentes `field` y `select` de Bulma.
// options: [{ value, label }]. Si se pasa `placeholder`, se agrega la opción vacía.
export default function SelectField({ label, value, onChange, options, placeholder }) {
  const id = useId();

  return (
    <div className="field">
      <label htmlFor={id} className="label is-small">
        {label}
      </label>
      <div className="control">
        <div className="select is-fullwidth">
          <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
