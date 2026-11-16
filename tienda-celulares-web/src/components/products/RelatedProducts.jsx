import { productsApi } from '../../api/productsApi';
import { useAsync } from '../../hooks/useAsync';
import ProductGrid from './ProductGrid';

// Otros productos del mismo tipo (sin repetir el actual), para seguir mirando.
export default function RelatedProducts({ product }) {
  const { data } = useAsync(async () => {
    const list = await productsApi.list({ tipo: product.tipo, limite: 12 });
    const sameBrand = list.filter((p) => p.id !== product.id && p.marca === product.marca);
    const others = list.filter((p) => p.id !== product.id && p.marca !== product.marca);
    return [...sameBrand, ...others].slice(0, 4);
  }, [product.id]);

  if (!data?.length) return null;

  return (
    <section className="mt-6" aria-labelledby="related-title">
      <h2 id="related-title" className="title is-4">
        También te puede interesar
      </h2>
      <ProductGrid products={data} />
    </section>
  );
}
