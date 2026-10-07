'use client';

import React, { useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { isVideoMedia, videoPoster, videoSrc, widthFromSizes } from '@/lib/media';

/**
 * The storefront's product media element.
 *
 * An image URL renders exactly as it always has, through next/image. A video URL — an admin can
 * upload one as a colour's swatch or hover media — renders as a muted, looping, inline <video>
 * that plays on its own while it is actually visible, so every card, carousel, quick view and
 * cart line already built on this component shows the clip with no change at the call site. Detection is the shared
 * isVideoMedia rule (extension, or Cloudinary's /video/upload/ path), so nothing beside the URL
 * has to be stored.
 *
 * `fill` keeps its meaning — the video covers the positioned parent — and the caller's className
 * (object-cover, opacity transitions) applies to it unchanged.
 */
export default function LuxuryImage(props: ImageProps) {
  const { src, alt, fill, className, style, width, height, sizes } = props;
  const isVideo = typeof src === 'string' && isVideoMedia({ url: src });
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // Reduced motion keeps the poster frame; everyone else gets the loop.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Set here and not only as the prop: React does not write `muted` into server HTML, and
    // mobile Safari will not start a video it believes has sound.
    video.muted = true;

    /*
     * Play only while the clip can be seen. With preload="none" an off-screen card, or a hover
     * layer sitting at opacity 0, downloads nothing until then. Hover layers fade via an opacity
     * transition on this element: start on the way in, pause once fully faded out.
     */
    let onScreen = false;
    const play = () => {
      if (onScreen) video.play().catch(() => {});
    };
    const sync = () => (onScreen && getComputedStyle(video).opacity !== '0' ? play() : video.pause());
    const onTransition = (e: TransitionEvent) => {
      if (e.propertyName !== 'opacity') return;
      if (e.type === 'transitionrun') play();
      else sync();
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    observer.observe(video);
    video.addEventListener('transitionrun', onTransition);
    video.addEventListener('transitionend', onTransition);
    return () => {
      observer.disconnect();
      video.removeEventListener('transitionrun', onTransition);
      video.removeEventListener('transitionend', onTransition);
      video.pause();
    };
  }, [isVideo, src]);

  if (!isVideo) return <Image {...props} alt={alt} />;

  return (
    <video
      ref={ref}
      src={videoSrc(src as string, widthFromSizes(sizes))}
      poster={videoPoster(src as string)}
      muted
      loop
      playsInline
      preload="none"
      aria-label={alt || undefined}
      width={fill ? undefined : (width as number | undefined)}
      height={fill ? undefined : (height as number | undefined)}
      className={`${fill ? 'absolute inset-0 h-full w-full ' : ''}${className ?? ''}`}
      style={style}
    />
  );
}
