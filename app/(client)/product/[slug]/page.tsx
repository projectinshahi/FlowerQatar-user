import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/actions/product.actions";
import { getRelatedProducts, mapDbProductToStore } from "@/lib/store-products";
import { getProductReviews } from "@/lib/services/reviews";
import { CATEGORY_META, shopCategoryHref } from "@/lib/category-config";
import type { CategoryType } from "@prisma/client";
import { absoluteUrl, stripHtml, SITE_NAME, SITE_URL } from "@/lib/site";
import { buildKeywords, productMetaDescription } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import ProductDetailClient from "@/components/client/product/ProductDetailClient";
import BlushingProductDetail from "@/components/client/blushing-blooms/BlushingProductDetail";

// Dedupe the DB read across generateMetadata + the page render (one query per request).
const loadProduct = cache((slug: string) => getProductBySlug(slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadProduct(slug);

  if (!result.success || !result.data) {
    /*
     * A database failure is not the same as a missing product, and metadata must not claim it
     * is — the page itself throws in that case and the error boundary renders. Either way the
     * page is noindex, so a transient blip cannot get a real product recorded as gone.
     */
    const missing = result.reason === "not_found";
    return {
      title: missing ? "Product Not Found" : "Product Unavailable",
      robots: { index: false, follow: false },
    };
  }

  const product = result.data;
  const store = mapDbProductToStore(product);
  const categoryMeta = product.categoryType ? (CATEGORY_META as Record<string, { label: string } | undefined>)[product.categoryType] : undefined;
  const categoryLabel = categoryMeta?.label ?? null;

  const description = productMetaDescription(product.name, product.description || product.shortDescription);
  const keywords = buildKeywords({
    name: product.name,
    subcategory: product.subcategory?.name,
    categoryLabel,
    colors: store.colors.map((c) => c.name),
  });
  const url = `/product/${product.slug}`;
  const image = store.image ? absoluteUrl(store.image) : undefined;
  // The layout applies the "%s | Lebami" title template; OG/Twitter need the full title.
  const ogTitle = `${product.name} | ${SITE_NAME}`;

  return {
    title: product.name,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: ogTitle,
      description,
      url,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await loadProduct(slug);

  /*
   * Only a genuinely missing product is a 404. A database failure re-throws so the error
   * boundary renders and the response is a 5xx — honest, retryable, and never indexed as
   * "this product is gone". `notFound()` throws, so it stays outside any try/catch.
   */
  if (!result.success && result.reason === "error") {
    throw new Error(`Could not load product "${slug}" — the database was unreachable.`);
  }
  if (!result.success || !result.data) {
    notFound();
  }

  const data = result.data;
  const store = mapDbProductToStore(data);
  const product = JSON.parse(JSON.stringify(data));

  const type = data.categoryType as CategoryType | null;

  // Same-category recommendations, resolved on the server so the client makes no extra call.
  const related = await getRelatedProducts(data.id, data.subcategoryId ?? null, type, 6);

  // Published reviews + their summary. Relative dates are computed HERE, on the server, and
  // passed down as finished strings — formatting them in the client component would produce
  // different text on each side and break hydration.
  const reviews = await getProductReviews(data.id);

  const typeMeta = type ? (CATEGORY_META as Record<string, { label: string } | undefined>)[type] : undefined;
  const categoryLabel = typeMeta?.label ?? null;
  const productUrl = absoluteUrl(`/product/${data.slug}`);
  const inStock = data.status === "PUBLISHED";

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.name,
    description: stripHtml(data.description || data.shortDescription || "", 500),
    image: store.image ? [absoluteUrl(store.image)] : undefined,
    sku: data.sku || undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: data.subcategory?.name || categoryLabel || undefined,
    itemCondition: "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      price: store.price,
      priceCurrency: "QAR",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: productUrl,
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };
  // Only advertise ratings when there are real reviews (Google rejects fabricated ones).
  // Uses the actual review rows — `store.rating` is a hardcoded 5 from the store mapper and
  // would have published a rating for products nobody has reviewed.
  if (reviews.summary.count > 0 && reviews.summary.average !== null) {
    productLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviews.summary.average,
      reviewCount: reviews.summary.count,
    };
  }

  // Breadcrumb trail: Home › [Category] › Product.
  const crumbs = [
    { name: "Home", item: SITE_URL },
    ...(type && typeMeta && categoryLabel ? [{ name: categoryLabel, item: absoluteUrl(shopCategoryHref(type)) }] : []),
    { name: data.name, item: productUrl },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.item,
    })),
  };

  /*
   * Blushing Blooms products get their own page design, the same way the category gets its own
   * listing. Placed here, at the end, so all of the SEO work above (metadata, product and
   * breadcrumb JSON-LD) is shared rather than duplicated — only the rendered surface differs.
   *
   * `store` carries a placeholder rating of 5 from mapDbProductToStore, which is fine where
   * nothing renders it (the cards) but not here. Precedence for the stars:
   *
   *   1. the curated rating an admin typed on the product, if any
   *   2. the live average of published reviews
   *   3. the mapper's placeholder
   *
   * `reviewCount` is still passed because the shared Product type requires it; the Blushing
   * Blooms design no longer prints it beside the stars.
   */
  if (type === "BLUSHING_BLOOMS") {
    return (
      <>
        <JsonLd data={[productLd, breadcrumbLd]} />
        <BlushingProductDetail
          product={{
            ...store,
            rating: data.rating ?? reviews.summary.average ?? store.rating,
            reviewCount: reviews.summary.count,
          }}
        />
      </>
    );
  }

  return (
    <>
      <JsonLd data={[productLd, breadcrumbLd]} />
      <ProductDetailClient product={product} related={related} reviews={reviews} />
    </>
  );
}
