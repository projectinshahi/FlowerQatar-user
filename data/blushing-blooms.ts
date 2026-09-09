import type { Product } from '@/types';
import type { CategoryType } from '@prisma/client';

/**
 * Fallback catalogue for the Blushing Blooms page.
 *
 * Mirrors the convention app/(client)/shop/page.tsx already uses (`dbProducts.length > 0 ?
 * dbProducts : PRODUCTS`): when the database holds no PUBLISHED Blushing Blooms products the
 * page still renders the designed grid instead of an empty one. As soon as an admin publishes
 * a real Blushing Blooms product these disappear entirely.
 *
 * The art is the six shipped stills. Paths are percent-encoded because the filenames contain
 * spaces and parentheses.
 */

/** The five swatch tones shown on every card in the design. */
const SWATCHES = [
  { name: 'Velvet Red', hex: '#A81E1E' },
  { name: 'Olive', hex: '#A9B02B' },
  { name: 'Fuchsia', hex: '#E0479B' },
  { name: 'Blush', hex: '#F2A6D2' },
  { name: 'Peach', hex: '#F3CBA9' },
];

const item = (
  id: string,
  name: string,
  image: string,
  price: number,
  badge?: string
): Product => ({
  id,
  slug: '',
  name,
  price,
  collection: 'blushing-blooms',
  collectionName: 'Blushing Blooms',
  colors: SWATCHES.map((c) => ({ ...c, image, hoverImage: image })),
  image,
  hoverImage: image,
  images: [image],
  badge,
  rating: 5,
  reviewCount: 0,
  description: '',
  isBestSeller: !!badge,
  categoryType: 'BLUSHING_BLOOMS' as CategoryType,
});

export const BLUSHING_BLOOMS_FALLBACK: Product[] = [
  item('bb-preview-1', 'Creme Chantilly', '/images/image%2039%20(1).png', 560, 'Best Seller'),
  item('bb-preview-2', 'Rose Reverie', '/images/image%2042.png', 560, 'Best Seller'),
  item('bb-preview-3', 'Amber Bloom', '/images/image%2045.png', 560, 'Best Seller'),
  item('bb-preview-4', 'Ivory Orchid', '/images/image%2043.png', 560, 'Best Seller'),
  item('bb-preview-5', 'Blush Garden', '/images/image%2041.png', 560, 'Best Seller'),
  item('bb-preview-6', 'Wild Petal', '/images/image%2044.png', 560, 'Best Seller'),
];
