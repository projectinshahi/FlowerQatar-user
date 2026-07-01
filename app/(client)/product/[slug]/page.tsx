import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/actions/product.actions";
import ProductDetailClient from "@/components/client/product/ProductDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const result = await getProductBySlug(resolvedParams.slug);
  
  if (!result.success || !result.data) {
    return {
      title: "Product Not Found",
    };
  }

  const product = result.data;
  return {
    title: product.seo?.seoTitle || product.name,
    description: product.seo?.metaDescription || product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const result = await getProductBySlug(resolvedParams.slug);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const product = JSON.parse(JSON.stringify(result.data));

  return (
    <ProductDetailClient product={product} />
  );
}
