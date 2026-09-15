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
 * A URL for surfaces that can only show a still — invoices, social previews, stored and admin
 * thumbnails. Colour swatch and hover media may be a video; an image passes straight through, a
 * video becomes its poster frame, or undefined when none can be derived so the caller falls
 * through to its next candidate.
 */
export function stillOf(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return isVideoMedia({ url }) ? videoPoster(url) : url;
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
