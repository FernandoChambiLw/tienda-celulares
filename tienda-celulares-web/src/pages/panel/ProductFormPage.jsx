import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { lookupsApi, productsAdminApi } from '../../api/panel/panelApi';
import FormField from '../../components/panel/FormField';
import PhotoUploader from '../../components/panel/PhotoUploader';
import AsyncView from '../../components/ui/AsyncView';
import PageHeader from '../../components/ui/PageHeader';
import { PRODUCT_STATES, PRODUCT_TYPES, TYPE_FIELDS } from '../../config/productFields';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';
import { EMPTY_PRODUCT, toFormValues, toPayload } from '../../utils/productForm';
import styles from './ProductFormPage.module.css';

// Crea o edita un producto (con su detalle según el tipo) y sube su foto.
export default function ProductFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  usePageTitle(editing ? 'Editar producto' : 'Nuevo producto');
  const navigate = useNavigate();

  const loaded = useAsync(
    () => Promise.all([
      lookupsApi.brands(),
      lookupsApi.categories(),
      editing ? productsAdminApi.get(id) : Promise.resolve(null),
    ]),
    [id],
  );
  const [brands, categories, product] = loaded.data ?? [[], [], null];

  const [values, setValues] = useState(EMPTY_PRODUCT);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  useEffect(() => {
    if (product) setValues(toFormValues(product));
  }, [product]);

  const set = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));
  const setDetail = (field) => (value) => setValues((prev) => ({ ...prev, detalle: { ...prev.detalle, [field]: value } }));
  const changeType = (tipo) => setValues((prev) => ({ ...prev, tipo_producto: tipo, detalle: {} }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFailure('');
    let saved = null;
    try {
      const payload = toPayload(values, { editing });
      saved = editing ? await productsAdminApi.update(id, payload) : await productsAdminApi.create(payload);
      if (photo) await productsAdminApi.uploadPhoto(saved.id_producto, photo);
      navigate('/panel/productos');
    } catch (e) {
      // Si el producto ya se creó pero falló la foto, se sigue en modo edición para no duplicarlo.
      if (saved && !editing) {
        navigate(`/panel/productos/${saved.id_producto}`, { replace: true });
      } else {
        setFailure(e.message);
        setBusy(false);
      }
    }
  };

  return (
    <>
      <PageHeader title={editing ? 'Editar producto' : 'Nuevo producto'} subtitle={editing ? product?.nombre : 'Completa los datos y guarda.'} />
      <AsyncView loading={loaded.loading} error={loaded.error} onRetry={loaded.reload}>
        <form className={styles.form} onSubmit={submit}>
          <section className={styles.block}>
            <h2>Datos generales</h2>
            <div className={styles.grid}>
              <FormField label="Tipo" kind="select" required options={PRODUCT_TYPES} value={values.tipo_producto}
                onChange={changeType} disabled={editing} />
              <FormField label="Código" required value={values.codigo} onChange={set('codigo')} maxLength={30} />
              <FormField label="Nombre" required value={values.nombre} onChange={set('nombre')} />
              <FormField label="Marca" kind="select" required value={values.id_marca} onChange={set('id_marca')}
                options={brands.map((b) => ({ value: String(b.id_marca), label: b.nombre }))} />
              <FormField label="Categoría" kind="select" required value={values.id_categoria} onChange={set('id_categoria')}
                options={categories.map((c) => ({ value: String(c.id_categoria), label: c.nombre }))} />
              <FormField label="Estado" kind="select" required value={values.estado} onChange={set('estado')} options={PRODUCT_STATES} />
              <FormField label="Precio de compra (Bs)" kind="number" required min="0" step="0.01" value={values.precio_compra} onChange={set('precio_compra')} />
              <FormField label="Precio de venta (Bs)" kind="number" required min="0" step="0.01" value={values.precio_venta} onChange={set('precio_venta')} />
              <FormField label="Garantía (meses)" kind="number" min="0" step="1" value={values.garantia_meses} onChange={set('garantia_meses')} />
            </div>
            <FormField label="Descripción" kind="textarea" value={values.descripcion} onChange={set('descripcion')} />
          </section>

          <section className={styles.block}>
            <h2>Especificaciones de {values.tipo_producto.toLowerCase()}</h2>
            <div className={styles.grid}>
              {TYPE_FIELDS[values.tipo_producto].map((f) => (
                <FormField key={f.name} label={f.label} kind={f.kind} required={f.required} options={f.options}
                  step={f.step} min={f.kind === 'number' ? '0' : undefined}
                  value={values.detalle[f.name] ?? (f.kind === 'bool' ? false : '')} onChange={setDetail(f.name)} />
              ))}
            </div>
          </section>

          <section className={styles.block}>
            <h2>Foto</h2>
            <PhotoUploader currentUrl={product?.foto_url} file={photo} onChange={setPhoto} onError={setFailure} />
          </section>

          {failure && <p className={styles.error} role="alert">{failure}</p>}
          <div className={styles.actions}>
            <Link className="btn btn--ghost" to="/panel/productos">Cancelar</Link>
            <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </AsyncView>
    </>
  );
}
