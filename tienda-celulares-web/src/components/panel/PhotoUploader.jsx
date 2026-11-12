import { useEffect, useMemo } from 'react';
import { assetUrl } from '../../config/env';
import styles from './PhotoUploader.module.css';

const MAX_BYTES = 3 * 1024 * 1024; // mismo límite que la API
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Elige una foto (JPG, PNG o WEBP de hasta 3 MB) y la previsualiza. La subida la hace el formulario.
export default function PhotoUploader({ currentUrl, file, onChange, onError }) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  const src = preview ?? (currentUrl ? assetUrl(currentUrl) : null);

  const pick = (event) => {
    const chosen = event.target.files[0];
    if (!chosen) return;
    if (!TYPES.includes(chosen.type)) return onError('Solo se aceptan imágenes JPG, PNG o WEBP.');
    if (chosen.size > MAX_BYTES) return onError('La imagen supera 3 MB.');
    onError('');
    onChange(chosen);
  };

  return (
    <div className={styles.box}>
      <div className={styles.preview}>
        {src ? <img src={src} alt="Foto del producto" /> : <span>Sin foto</span>}
      </div>
      <label className="btn btn--ghost btn--small">
        {src ? 'Cambiar foto' : 'Elegir foto'}
        <input type="file" accept={TYPES.join(',')} onChange={pick} hidden />
      </label>
      <small>JPG, PNG o WEBP, máximo 3 MB. Ideal: ~800 × 640 px.</small>
    </div>
  );
}
