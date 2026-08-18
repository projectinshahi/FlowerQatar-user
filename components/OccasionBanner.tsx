import Image from 'next/image';
import { isVideoMedia } from '@/lib/media';

/**
 * Occasion banner that renders either a still or a video clip.
 *
 * The media type is detected from the URL rather than stored in a column: Cloudinary puts the
 * resource kind in the delivery path, and lib/media.ts already owns that rule for product
 * galleries. Reusing it means no migration and one place where the rules can change.
 *
 * Videos autoplay muted and inline — the only combination browsers permit without a user
 * gesture — and loop silently, so the banner behaves like motion art rather than a player.
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
  if (isVideoMedia({ url })) {
    return (
      <video
        src={url}
        // A muted, inline, looping video is decorative; controls would invite interaction
        // with something that has no audio and no meaningful timeline.
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={title}
        /*
         * `rounded-[inherit]` matters: Safari (desktop and iOS) does not reliably clip a
         * playing <video> to a rounded parent via overflow-hidden, so the corners come out
         * square. Giving the element the parent's own radius clips it directly.
         *
         * object-cover + the parent's aspect ratio is what makes it responsive — the frame
         * scales with the viewport and the clip is centred rather than letterboxed.
         */
        className={`h-full w-full rounded-[inherit] object-cover ${className}`}
      />
    );
  }

  return (
    <Image
      src={url}
      alt={title}
      fill
      sizes={sizes}
      priority={priority}
      className={`rounded-[inherit] object-cover ${className}`}
    />
  );
}
