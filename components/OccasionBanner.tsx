import LuxuryImage from '@/components/LuxuryImage';

/**
 * Occasion banner that renders either a still or a video clip.
 *
 * The media type is detected from the URL rather than stored in a column: Cloudinary puts the
 * resource kind in the delivery path, and lib/media.ts already owns that rule. LuxuryImage
 * applies it, and plays a clip muted, inline and looping only while it is on screen.
 *
 * `rounded-[inherit]` matters: Safari (desktop and iOS) does not reliably clip a playing
 * <video> to a rounded parent via overflow-hidden, so the corners come out square. Giving the
 * element the parent's own radius clips it directly.
 */
export default function OccasionBanner({
  url,
  title,
  sizes,
  priority = false,
  className = '',
}: {
  url: string;
  title: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <LuxuryImage
      src={url}
      alt={title}
      fill
      sizes={sizes}
      priority={priority}
      className={`rounded-[inherit] object-cover ${className}`}
    />
  );
}
