import { PRODUCTS } from '../../../../data/products';

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({
    slug: product.slug,
  }));
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
