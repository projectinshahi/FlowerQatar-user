"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Maximize2, ImageOff, ArrowUp, ArrowDown, Film, Play } from "lucide-react";

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

/** Detect video items by explicit type OR by URL extension / Cloudinary video path */
function isVideoItem(item: GalleryImage): boolean {
  if (item.type === "video") return true;
  if (typeof item.url === "string") {
    if (/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(item.url)) return true;
    if (item.url.includes("/video/upload/")) return true;
  }
  return false;
}

export default function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const pics = (images || []).filter((i) => i?.url);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoomedFull, setZoomedFull] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number; rw: number; rh: number } | null>(null);
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
    setZoom({ x: e.clientX - r.left, y: e.clientY - r.top, rw: r.width, rh: r.height });
  };

  // lens position (clamped inside the image)
  const lensLeft = zoom ? clamp(zoom.x - LENS_W / 2, 0, zoom.rw - LENS_W) : 0;
  const lensTop = zoom ? clamp(zoom.y - LENS_H / 2, 0, zoom.rh - LENS_H) : 0;

  return (
    <div onKeyDown={onKeyDown} tabIndex={0} aria-roledescription="carousel" aria-label={`${productName} images`} className="relative outline-none">
      <div className="w-full flex items-center gap-4 lg:gap-6">
        {/* Main image / video */}
        <div
          ref={frameRef}
          className={`relative flex-grow w-full aspect-[4/5] bg-[#FAFAFA] overflow-hidden group rounded-sm ${currentIsVideo ? "cursor-pointer" : "cursor-crosshair"}`}
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
              src={current}
              controls
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
                className="object-contain lg:object-cover"
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

      {/* Side zoom panel (desktop only, images only) — appears to the right while hovering */}
      {zoom && !currentIsVideo && (
        <div
          className="hidden lg:block absolute top-0 left-full ml-6 z-40 rounded-sm border border-[#EBEBEB] bg-white shadow-2xl overflow-hidden pointer-events-none"
          style={{
            width: PANEL_W,
            height: PANEL_H,
            backgroundImage: `url(${current})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${zoom.rw * ZOOM}px ${zoom.rh * ZOOM}px`,
            backgroundPosition: `-${lensLeft * ZOOM}px -${lensTop * ZOOM}px`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Fullscreen lightbox (tap/pinch zoom for touch devices) */}
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
                  src={current}
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
      </AnimatePresence>
    </div>
  );
}
