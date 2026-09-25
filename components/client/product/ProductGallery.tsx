"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Maximize2, ImageOff, ArrowUp, ArrowDown, Film, Play } from "lucide-react";
import { isVideoMedia, videoPoster, videoSrc } from "@/lib/media";

export interface GalleryImage {
  url: string;
  type?: "image" | "video";
}

const SWIPE_THRESHOLD = 40;
const ACTIVE_DOT = "#C4A882"; // gold accent (matches the product page palette)

// Side-zoom config. Panel keeps the image's 4:5 aspect so the lens ↔ panel mapping stays accurate.
const ZOOM = 2.4;
const PANEL_W = 340;
const PANEL_H = 425;
const LENS_W = PANEL_W / ZOOM;
const LENS_H = PANEL_H / ZOOM;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/*
 * True only after hydration: the server snapshot is false, so the server HTML and the first
 * client render agree, then React re-renders with the client value. Same pattern as
 * LanguageToggle. Gates the lightbox portal, which needs `document.body`.
 */
const noopSubscribe = () => () => {};
const useIsClient = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

/** Shared with the admin uploader and the store mapper so the rules can't drift apart. */
const isVideoItem = isVideoMedia;

export default function ProductGallery({
  images,
  productName,
  showThumbnails = false,
}: {
  images: GalleryImage[];
  productName: string;
  /** True when `images` is the colour's uploaded Gallery Media (not the hover/placeholder fallback). */
  showThumbnails?: boolean;
}) {
  const pics = (images || []).filter((i) => i?.url);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoomedFull, setZoomedFull] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number; rw: number; rh: number; nw: number; nh: number } | null>(null);
  const isClient = useIsClient();
  const touchX = useRef<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const count = pics.length;
  const go = useCallback((dir: number) => setActive((a) => (a + dir + count) % count), [count]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (active >= count && count > 0) setActive(0);
  }, [count, active]);

  const currentItem = pics[active];
  const currentIsVideo = currentItem ? isVideoItem(currentItem) : false;
  const current = currentItem?.url;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(-1); }
  };

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, go]);

  // Video that is the displayed media plays on its own — muted and inline, which every browser
  // allows without a gesture. Controls stay, so a shopper can still unmute or pause. Set in an
  // effect because React omits `muted` from server HTML and mobile Safari then refuses to start.
  useEffect(() => {
    const v = videoRef.current;
    if (!currentIsVideo || !v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.muted = true;
    v.play().catch(() => {});
  }, [current, currentIsVideo]);

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  if (count === 0) {
    return (
      <div className="aspect-[4/5] w-full rounded-sm bg-[#F3F0EA] flex flex-col items-center justify-center text-[#B9B2A6]">
        <ImageOff size={40} />
        <p className="text-[12px] mt-2 uppercase tracking-[0.12em]">No images available</p>
      </div>
    );
  }

  const onMove = (e: React.MouseEvent) => {
    if (currentIsVideo) return; // No zoom lens on videos
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // The photo's own proportions — the frame crops it (object-cover), so the zoom needs them.
    const img = el.querySelector("img");
    const nw = img?.naturalWidth || r.width;
    const nh = img?.naturalHeight || r.height;
    setZoom({ x: e.clientX - r.left, y: e.clientY - r.top, rw: r.width, rh: r.height, nw, nh });
  };

  // lens position (clamped inside the image)
  const lensLeft = zoom ? clamp(zoom.x - LENS_W / 2, 0, zoom.rw - LENS_W) : 0;
  const lensTop = zoom ? clamp(zoom.y - LENS_H / 2, 0, zoom.rh - LENS_H) : 0;

  /*
   * Where the photo actually sits inside the frame. The frame shows it with object-cover —
   * scaled to cover, centred, overflow cropped — so the magnified view must use that same
   * geometry. Sizing the zoom background to the FRAME's box instead stretched every photo whose
   * shape differs from the frame's, and put the panel off from what was under the lens.
   */
  const cover = zoom
    ? (() => {
        const s = Math.max(zoom.rw / zoom.nw, zoom.rh / zoom.nh);
        const dw = zoom.nw * s;
        const dh = zoom.nh * s;
        return { dw, dh, ox: (zoom.rw - dw) / 2, oy: (zoom.rh - dh) / 2 };
      })()
    : null;

  return (
    /* lg:left-8 nudges the photo, arrows and thumbnails right as one block. A relative offset
       rather than padding/margin, so the width the photo sizes itself from is untouched — the
       photo stays the same size — and the 2rem lands inside the column's own lg:pr-8. */
    <div onKeyDown={onKeyDown} tabIndex={0} aria-roledescription="carousel" aria-label={`${productName} images`} className="relative outline-none lg:left-8">
      <div className="w-full flex items-center gap-4 lg:gap-6">
        {/* Main image / video.
            Same frame model as the Blushing Blooms gallery: a 650:713 shape and, on desktop, a
            width capped by the viewport height, so the whole photograph is always on screen. The
            old 4:5 frame had no such cap and ran 95-115px below the fold on a laptop, pushing the
            image past what the shopper could see. 13.5rem is the Blushing Blooms reserve, so the
            two pages size their photo identically; it still clears the fold here, where the
            frame starts ~207px down. 0.912 is 650/713.

            Left-aligned rather than centred: the thumbnail strip below starts at the column edge,
            and centring the frame in the space beside the arrows pushed it right of the strip —
            further the wider and shorter the screen. */}
        <div
          ref={frameRef}
          className={`relative flex-grow w-full aspect-[650/713] bg-[#FAFAFA] overflow-hidden group rounded-sm lg:flex-grow-0 lg:w-[min(100%,calc((100vh-13.5rem)*0.912))] ${currentIsVideo ? "cursor-pointer" : "cursor-crosshair"}`}
          onMouseMove={onMove}
          onMouseLeave={() => setZoom(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => {
            if (currentIsVideo) {
              // Toggle play/pause on click for the inline video
              if (videoRef.current) {
                if (videoRef.current.paused) videoRef.current.play();
                else videoRef.current.pause();
              }
            } else {
              setLightbox(true);
            }
          }}
          role="button"
          aria-label={currentIsVideo ? "Play/pause video" : "Open full-screen preview"}
        >
          {currentIsVideo ? (
            /* Video player */
            <video
              ref={videoRef}
              key={current}
              src={videoSrc(current)}
              poster={videoPoster(current)}
              controls
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
              style={{ background: "#000" }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            /* Image */
            <>
              <Image
                key={current}
                src={current}
                alt={`${productName} — image ${active + 1} of ${count}`}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority={active === 0}
                /* Every photo fills the same 4:5 frame at every width. `object-contain` below lg
                   letterboxed each one at its own proportions, so the image changed size from
                   slide to slide on phones and tablets. */
                className="object-cover"
              />

              {/* Hover lens (desktop only, images only) */}
              {zoom && (
                <div
                  className="hidden lg:block absolute border border-primary/40 bg-primary/10 pointer-events-none"
                  style={{ width: LENS_W, height: LENS_H, left: lensLeft, top: lensTop }}
                />
              )}

              <span className="absolute top-3 right-3 bg-white/85 text-primary rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity lg:hidden">
                <Maximize2 size={15} />
              </span>
            </>
          )}

          {/* Mobile dots */}
          {count > 1 && (
            <div className="flex lg:hidden absolute bottom-5 left-0 right-0 justify-center gap-2 px-4 z-10">
              {pics.map((item, idx) => (
                <span
                  key={idx}
                  className="flex items-center justify-center transition-colors"
                  style={{
                    width: isVideoItem(item) ? 18 : 6,
                    height: 6,
                    borderRadius: isVideoItem(item) ? 3 : "50%",
                    backgroundColor: idx === active ? "#000" : "#D5D5D5",
                  }}
                >
                  {isVideoItem(item) && (
                    <Film size={4} className="text-white" style={{ display: idx === active ? "block" : "none" }} />
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Vertical navigation (desktop) — up arrow · dots · down arrow */}
        {count > 1 && (
          <div className="hidden lg:flex flex-col items-center gap-4 flex-shrink-0 z-10 pr-2">
            <button type="button" onClick={() => go(-1)} aria-label="Previous image" className="w-8 h-8 rounded-full border border-[#EBEBEB] flex items-center justify-center bg-white text-[#8A8A8A] hover:bg-gray-50 hover:text-black transition-colors">
              <ArrowUp size={14} strokeWidth={1.5} />
            </button>
            <div className="flex flex-col gap-3 py-2">
              {pics.map((item, idx) => {
                const itemIsVideo = isVideoItem(item);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActive(idx)}
                    aria-label={itemIsVideo ? `View video ${idx + 1}` : `View image ${idx + 1}`}
                    aria-current={idx === active}
                    className="relative flex items-center justify-center transition-all"
                    style={{
                      width: itemIsVideo ? 18 : 7,
                      height: itemIsVideo ? 12 : 7,
                      borderRadius: itemIsVideo ? 3 : "50%",
                      backgroundColor: idx === active ? ACTIVE_DOT : "#D5D5D5",
                      transform: idx === active ? "scale(1.25)" : "scale(1)",
                    }}
                  >
                    {itemIsVideo && (
                      <Play size={6} className="fill-white text-white ml-[1px]" />
                    )}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => go(1)} aria-label="Next image" className="w-8 h-8 rounded-full border border-[#EBEBEB] flex items-center justify-center bg-white text-black hover:bg-gray-50 transition-colors">
              <ArrowDown size={14} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>

      {/* Gallery Media thumbnails — each uploaded image or video under the main frame. Selecting one
          drives the same `active` index as the arrows, dots, swipe and keyboard, so they all agree,
          and a video selected here autoplays through the effect above. */}
      {showThumbnails && (
        <div
          /* Exactly the main frame's width, so the strip sits under the photo and never past it.
             With more than one item the frame shares its row with the arrow column (24px gap +
             32px buttons + 8px padding = 4rem), which is why that case reserves 4rem. */
          className={`no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 lg:mt-4 lg:gap-3 ${
            count > 1
              ? "lg:w-[min(calc(100%-4rem),calc((100vh-13.5rem)*0.912))]"
              : "lg:w-[min(100%,calc((100vh-13.5rem)*0.912))]"
          }`}
        >
          {pics.map((item, idx) => {
            const video = isVideoItem(item);
            const on = idx === active;
            return (
              <button
                key={`${item.url}-${idx}`}
                type="button"
                data-gallery-thumb
                onClick={() => setActive(idx)}
                aria-label={`Show ${video ? "video" : "image"} ${idx + 1} of ${count}`}
                aria-pressed={on}
                className={`relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-sm border bg-[#FAFAFA] transition-opacity sm:w-16 lg:w-[72px] ${on ? "" : "opacity-60 hover:opacity-100"}`}
                style={{ borderColor: on ? ACTIVE_DOT : "#EBEBEB" }}
              >
                {video ? (
                  <>
                    <video src={videoSrc(item.url, 320)} poster={videoPoster(item.url)} preload="metadata" muted playsInline tabIndex={-1} aria-hidden="true" className="pointer-events-none h-full w-full object-cover" />
                    <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <Play size={14} className="fill-white text-white" />
                    </span>
                  </>
                ) : (
                  <Image src={item.url} alt="" fill sizes="72px" className="object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Side zoom panel (desktop only, images only) — appears to the right while hovering */}
      {zoom && !currentIsVideo && (
        <div
          className="hidden lg:block absolute top-0 left-full ml-6 z-40 rounded-sm border border-[#EBEBEB] bg-white shadow-2xl overflow-hidden pointer-events-none"
          style={{
            width: PANEL_W,
            height: PANEL_H,
            backgroundImage: `url(${current})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${cover!.dw * ZOOM}px ${cover!.dh * ZOOM}px`,
            backgroundPosition: `${-(lensLeft - cover!.ox) * ZOOM}px ${-(lensTop - cover!.oy) * ZOOM}px`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Fullscreen lightbox (tap/pinch zoom for touch devices).
          Portalled to <body>: the gallery column is `position: sticky`, which creates its own
          stacking context, so rendered in place the overlay's z-[95] was trapped under the fixed
          header (z-50) — the header stayed lit on top and hid the top of the photo. */}
      {isClient && createPortal(
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] bg-black/90 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Media preview" onClick={() => setLightbox(false)}>
            <button type="button" onClick={() => setLightbox(false)} aria-label="Close" className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10"><X size={24} /></button>
            {count > 1 && (
              <>
                <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous" className="absolute left-3 md:left-6 text-white/80 hover:text-white p-2 z-10"><ChevronLeft size={30} /></button>
                <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next" className="absolute right-3 md:right-6 text-white/80 hover:text-white p-2 z-10"><ChevronRight size={30} /></button>
              </>
            )}

            {currentIsVideo ? (
              /* Lightbox video player */
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative w-[92vw] h-[80vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <video
                  src={videoSrc(current)}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full rounded-sm"
                  style={{ background: "#000" }}
                />
              </motion.div>
            ) : (
              /* Lightbox image */
              <motion.div key={active} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: zoomedFull ? 1.8 : 1 }} transition={{ duration: 0.2 }} className="relative w-[92vw] h-[80vh] cursor-zoom-in" style={{ touchAction: "pinch-zoom" }} onClick={(e) => { e.stopPropagation(); setZoomedFull((z) => !z); }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                <Image src={current} alt={`${productName} — enlarged`} fill sizes="92vw" className="object-contain" />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
}
