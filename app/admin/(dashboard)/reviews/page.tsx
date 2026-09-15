import { Star } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { logDbError } from '@/lib/prisma-error';
import { imagesOnly, stillOf } from '@/lib/media';
import ProductReviewsManager, {
  type ProductRow,
} from '@/components/admin/reviews/ProductReviewsManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Product Reviews | Admin' };

/** Loose shape of the variants JSON — only the fields this thumbnail lookup reads. */
type ColorVariantLike = { galleryImages?: unknown; swatchImage?: string | null };
type VariantLike = { colorVariants?: ColorVariantLike[] };

/** First still image from the variants JSON, for the row thumbnail. */
function thumbnailOf(variants: unknown): string | null {
  const list: VariantLike[] = Array.isArray(variants) ? variants : [];
  for (const colour of list.flatMap((v) => v?.colorVariants ?? [])) {
    // The Color Swatch upload is the main media; a video contributes its poster frame.
    const swatch = stillOf(colour?.swatchImage);
    if (swatch) return swatch;
    // imagesOnly skips videos — a clip URL in an <img> renders as a broken thumbnail.
    const still = imagesOnly(colour?.galleryImages as never)[0]?.url;
    if (still) return still;
  }
  return null;
}

/**
 * Every product with its review tally.
 *
 * Counts come from two grouped aggregates rather than a per-product query — a review count on
 * a list of N products would otherwise be N+1 round trips.
 */
async function getProducts(): Promise<ProductRow[]> {
  try {
    const [products, totals, published] = await Promise.all([
      prisma.product.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, status: true, variants: true },
      }),
      prisma.productReview.groupBy({ by: ['productId'], _count: { _all: true } }),
      prisma.productReview.groupBy({
        by: ['productId'],
        where: { isPublished: true },
        _count: { _all: true },
        _avg: { rating: true },
      }),
    ]);

    const totalBy = new Map(totals.map((t) => [t.productId, t._count._all]));
    const pubBy = new Map(published.map((p) => [p.productId, p]));

    return products.map((p) => {
      const pub = pubBy.get(p.id);
      const avg = pub?._avg.rating ?? null;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: p.status,
        image: thumbnailOf(p.variants),
        totalReviews: totalBy.get(p.id) ?? 0,
        publishedReviews: pub?._count._all ?? 0,
        // Rounded here so the client renders a fixed string (no locale/precision drift).
        averageRating: avg === null ? null : Math.round(avg * 10) / 10,
      };
    });
  } catch (error) {
    // A database blip must not blank the page; the manager shows its own empty state.
    logDbError('admin/reviews.getProducts', error);
    return [];
  }
}

export default async function ReviewsPage() {
  const products = await getProducts();
  const withReviews = products.filter((p) => p.totalReviews > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
        <div className="rounded-xl bg-white p-2.5 text-[#A83A22] shadow-sm">
          <Star className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Product Reviews</h1>
          <p className="mt-1 text-sm text-gray-600">
            Pick a product to read, add or edit its reviews. You can add as many reviews as you
            like to each product.
            {products.length > 0 && (
              <span className="ml-1 text-gray-500">
                {withReviews} of {products.length} products have reviews.
              </span>
            )}
          </p>
        </div>
      </div>

      <ProductReviewsManager products={products} />
    </div>
  );
}
