'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

/**
 * next/image with a shimmer underneath until the bitmap decodes.
 *
 * The wrapper owns the aspect ratio and the image is absolutely positioned inside it, so the
 * box never resizes when the photo arrives — the shimmer simply fades out beneath it.
 *
 * Client component by necessity: `onLoad` is the only reliable "decoded" signal. Use it for
 * hero/gallery imagery where a blank box would be obvious; ordinary thumbnails do not need
 * the extra JavaScript.
 */
export default function ImageWithSkeleton({
  aspect = 'aspect-square',
  className = '',
  wrapperClassName = '',
  alt,
  ...props
}: Omit<ImageProps, 'onLoad'> & {
  /** Tailwind aspect utility that reserves the space, e.g. "aspect-[4/5]". */
  aspect?: string;
  wrapperClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className={`relative block overflow-hidden ${aspect} ${wrapperClassName}`}>
      {!loaded && <span aria-hidden="true" className="skeleton absolute inset-0 block" />}
      <Image
        {...props}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </span>
  );
}
