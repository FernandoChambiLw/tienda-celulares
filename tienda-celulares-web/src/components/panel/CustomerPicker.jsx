import { useState } from 'react';
import { customersApi } from '../../api/panel/panelApi';
import { useAsync } from '../../hooks/useAsync';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import styles from './Pickers.module.css';

// Busca clientes por nombre o CI y permite elegir uno.
export default function CustomerPicker({ value, onChange }) {
  const [text, setText] = useState('');
  const term = useDebouncedValue(text.trim(), 300);
  const { data } = useAsync(() => (term ? customersApi.list({ q: term, estado: 'Activo', limit: 6 }) : Promise.resolve([])), [term]);

  if (value) {
    return (
      <div className={styles.chosen}>
        <span>
          <strong>{value.nombres} {value.apellido_paterno}</strong>
          <small> CI {value.ci}</small>
        </span>
        <button type="button" className={styles.link} onClick={() => onChange(null)}>Cambiar</button>
      </div>
    );
  }

  return (
    <div>
      <input className={styles.input} type="search" placeholder="Buscar cliente por nombre o CI" value={text} onChange={(e) => setText(e.target.value)} />
      {term && (
        <ul className={styles.results}>
          {(data ?? []).map((c) => (
            <li key={c.id_cliente}>
              <button type="button" onClick={() => onChange(c)}>
                {c.nombres} {c.apellido_paterno} <small>CI {c.ci}</small>
              </button>
            </li>
          ))}
          {data && !data.length && <li className={styles.none}>Sin coincidencias</li>}
        </ul>
      )}
    </div>
  );
}
