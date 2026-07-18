import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/actions/product.actions";
import { mapDbProductToStore } from "@/lib/store-products";
import { absoluteUrl, stripHtml } from "@/lib/site";
import JsonLd from "@/components/seo/JsonLd";
import ProductDetailClient from "@/components/client/product/ProductDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const result = await getProductBySlug(resolvedParams.slug);

  if (!result.success || !result.data) {
    return { title: "Product Not Found" };
  }

  const product = result.data;
  const store = mapDbProductToStore(product);
  const description = stripHtml(product.description || product.shortDescription || "Discover our elegant collection of preserved Eternity® Roses.");
  const url = `/product/${product.slug}`;
  const image = store.image;

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const result = await getProductBySlug(resolvedParams.slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const store = mapDbProductToStore(result.data);
  const product = JSON.parse(JSON.stringify(result.data));

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: result.data.name,
    description: stripHtml(result.data.description || result.data.shortDescription || ""),
    image: store.image ? [absoluteUrl(store.image)] : undefined,
    sku: result.data.sku || undefined,
    brand: { "@type": "Brand", name: "Lebami" },
    category: result.data.category?.name || undefined,
    offers: {
      "@type": "Offer",
      price: store.price,
      priceCurrency: "QAR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/product/${result.data.slug}`),
    },
  };

  return (
    <>
      <JsonLd data={productLd} />
      <ProductDetailClient product={product} />
    </>
  );
}
