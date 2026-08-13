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
