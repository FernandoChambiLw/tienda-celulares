import { useState } from 'react';
import { productsAdminApi } from '../../api/panel/panelApi';
import { useAsync } from '../../hooks/useAsync';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatBs } from '../../utils/format';
import styles from './Pickers.module.css';

// Busca productos activos; `disabledIds` son los que ya están en el carrito.
export default function ProductPicker({ onPick, disabledIds }) {
  const [text, setText] = useState('');
  const term = useDebouncedValue(text.trim(), 300);
  const { data } = useAsync(() => (term ? productsAdminApi.list({ q: term, limit: 8 }) : Promise.resolve([])), [term]);

  return (
    <div>
      <input className={styles.input} type="search" placeholder="Buscar producto por nombre o código" value={text} onChange={(e) => setText(e.target.value)} />
      {term && (
        <ul className={styles.results}>
          {(data ?? []).map((p) => {
            const out = p.stock_total <= 0;
            return (
              <li key={p.id_producto}>
                <button type="button" disabled={out || disabledIds.includes(p.id_producto)} onClick={() => { onPick(p); setText(''); }}>
                  {p.nombre} <small>{formatBs(Number(p.precio_venta))} · {out ? 'sin stock' : `${p.stock_total} en stock`}</small>
                </button>
              </li>
            );
          })}
          {data && !data.length && <li className={styles.none}>Sin coincidencias</li>}
        </ul>
      )}
    </div>
  );
}
