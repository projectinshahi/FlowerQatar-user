/**
 * Gallery media helpers.
 *
 * A gallery entry is `{ url, publicId, type?, isPrimary, order }` inside the product's
 * `variants` JSON. `type` was added when Blushing Blooms gained video, so older rows have no
 * `type` at all — every consumer must fall back to sniffing the URL. That fallback was
 * copy-pasted into four files; it lives here now so the rules can only be defined once.
 */

export type GalleryMedia = {
  url?: string;
  type?: string;
  isPrimary?: boolean;
  order?: number;
};

const VIDEO_EXTENSION = /\.(mp4|webm|mov|ogg)(\?.*)?$/i;

/** Cloudinary puts the resource kind in the delivery path, which survives any extension. */
const CLOUDINARY_VIDEO_PATH = '/video/upload/';

export function isVideoMedia(item: GalleryMedia | null | undefined): boolean {
  if (!item) return false;
  if (item.type === 'video') return true;
  if (typeof item.url !== 'string') return false;
  return VIDEO_EXTENSION.test(item.url) || item.url.includes(CLOUDINARY_VIDEO_PATH);
}

/** Only still images — for cards, cart thumbnails and anything rendered in an <img>. */
export const imagesOnly = <T extends GalleryMedia>(media: T[] | null | undefined): T[] =>
  (media ?? []).filter((m) => m?.url && !isVideoMedia(m));

/**
 * A colour's Gallery Media in admin order, each tagged image or video — what a thumbnail strip
 * renders. Rows with no url are dropped: there is nothing to show for them.
 */
export const galleryMedia = (media: GalleryMedia[] | null | undefined): { url: string; type: 'image' | 'video' }[] =>
  (media ?? [])
    .filter((m): m is GalleryMedia & { url: string } => typeof m?.url === 'string' && m.url !== '')
    .map((m) => ({ url: m.url, type: isVideoMedia(m) ? ('video' as const) : ('image' as const) }));

/**
 * A still frame for a video, where one can be derived: Cloudinary renders frame 0 as a JPEG when
 * `so_0,f_jpg` is added to the delivery path. Undefined for anything else — a local .mp4 has no
 * server to render a frame from.
 */
export function videoPoster(url: string | null | undefined): string | undefined {
  if (!url || !url.includes(CLOUDINARY_VIDEO_PATH)) return undefined;
  return url
    .replace(CLOUDINARY_VIDEO_PATH, `${CLOUDINARY_VIDEO_PATH}so_0,f_jpg/`)
    .replace(/\.[a-z0-9]+(\?.*)?$/i, '.jpg$1');
}

/**
 * The widths we ask Cloudinary to encode at. Four buckets rather than the exact rendered width
 * so a handful of derived videos get cached and reused across the site instead of one per
 * element; 1280 covers a full-bleed hero on a 1440 layout.
 */
const VIDEO_WIDTHS = [320, 640, 960, 1280] as const;

/**
 * The delivery URL to actually play.
 *
 * Uploads are stored as the admin sent them — a phone recording arrives as a 6MB .mov — and
 * every <video> pointed straight at that original. Cloudinary re-encodes on request, so this
 * adds the transformation the storage URL never had:
 *
 *   q_auto           compress to the quality its analysis says is visually equivalent
 *   f_auto:video     deliver mp4/webm rather than whatever container was uploaded, which also
 *                    fixes .mov files that Firefox and Safari refuse to play at all
 *   c_limit,w_<n>    cap the resolution at the size the element can actually show; c_limit
 *                    never enlarges, so a small source is passed through untouched
 *
 * Measured on the current home page: 5.97MB -> 1.26MB at w_1280, 0.60MB at w_640. The frames
 * are the same footage at the same aspect ratio, so nothing about the layout or the look
 * changes. Anything not served by Cloudinary (a local /images/*.mp4) is returned unchanged.
 */
export function videoSrc(url: string | null | undefined, renderedWidth?: number): string {
  if (!url || !url.includes(CLOUDINARY_VIDEO_PATH)) return url ?? '';
  const w = VIDEO_WIDTHS.find((c) => c >= (renderedWidth ?? Infinity)) ?? 1280;
  return url.replace(CLOUDINARY_VIDEO_PATH, `${CLOUDINARY_VIDEO_PATH}f_auto:video,q_auto,c_limit,w_${w}/`);
}

/**
 * The widest this element can ever render, read off the `sizes` attribute the call site
 * already passes to next/image — so every caller gets a correctly sized video without having
 * to state its width a second time. A vw value is resolved against 1440, the layout's max
 * width. Undefined when there is no sizes attribute to read, which asks for the largest bucket.
 */
export function widthFromSizes(sizes: string | undefined): number | undefined {
  if (!sizes) return undefined;
  let widest = 0;
  /*
   * A sizes attribute is a comma-separated list of "<media-condition> <size>" pairs ending in
   * a bare fallback size. Only the size is the width the element renders at — reading the
   * whole string would take the 768 out of "(max-width: 768px) 50vw" and ask for a video four
   * times the width that branch actually shows.
   */
  for (const part of sizes.split(',')) {
    const size = part.trim().split(')').pop() ?? '';
    const m = size.match(/(\d+(?:\.\d+)?)\s*(vw|px)/);
    if (m) widest = Math.max(widest, m[2] === 'vw' ? (Number(m[1]) / 100) * 1440 : Number(m[1]));
  }
  return widest || undefined;
}

/**
 * A URL for surfaces that can only show a still — invoices, social previews, stored and admin
 * thumbnails. Colour swatch and hover media may be a video; an image passes straight through, a
 * video becomes its poster frame, or undefined when none can be derived so the caller falls
 * through to its next candidate.
 */
export function stillOf(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return isVideoMedia({ url }) ? videoPoster(url) : url;
}

/** The shape of the colour variants stored in Product.variants; only the media fields matter here. */
type ColorVariantMedia = {
  colorName?: string | null;
  isDefault?: boolean;
  swatchImage?: string | null;
  hoverImage?: string | null;
  galleryImages?: { url?: string | null; isPrimary?: boolean }[];
};

/**
 * The photo of a specific colour of a product, for order lines and anywhere else that names the
 * colour a customer chose.
 *
 * Product imagery lives inside the variants JSON, so the recorded colour is what picks the right
 * picture: an order that says "Red" must not show the white arrangement. Falls back to the
 * default colour when the name no longer matches (an admin can rename a colour after the sale),
 * then to the first colour, then to nothing when the product has no usable media at all.
 *
 * Media order within a colour matches the cart's (lib/services/cart.ts): the colour swatch is its
 * main image, the primary gallery item and the hover image are fallbacks. Everything goes through
 * stillOf, because these surfaces can only show a still.
 */
export function orderedItemImage(variants: unknown, colorName: string | null | undefined): string | null {
  const list = Array.isArray(variants) ? (variants as { colorVariants?: ColorVariantMedia[] }[]) : [];
  const colors = list.flatMap((v) => (Array.isArray(v?.colorVariants) ? v.colorVariants : []));
  const color =
    (colorName ? colors.find((c) => c?.colorName === colorName) : undefined) ??
    colors.find((c) => c?.isDefault) ??
    colors[0];
  if (!color) return null;

  const gallery = Array.isArray(color.galleryImages) ? color.galleryImages : [];
  const primary = gallery.find((g) => g?.isPrimary) ?? gallery[0];
  return stillOf(color.swatchImage) ?? stillOf(primary?.url) ?? stillOf(color.hoverImage) ?? null;
}

/**
 * Whether a newly added item should become the primary one.
 *
 * Primary must always be a still image: it is what the cart, product cards and order lines
 * render. Uploading a video first used to leave a gallery with no primary at all, because the
 * check only looked at whether the gallery was empty rather than whether an image already
 * claimed the slot.
 */
export function shouldBePrimary(existing: GalleryMedia[], incomingIsVideo: boolean): boolean {
  if (incomingIsVideo) return false;
  return !existing.some((m) => m?.isPrimary && !isVideoMedia(m));
}
