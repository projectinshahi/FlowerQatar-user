"use client";

import { flagUrl } from "../../../lib/geo";

/** Small country flag image (SVG via flagcdn) — consistent across OSes. */
export default function Flag({ code, className }: { code: string; className?: string }) {
  if (!code) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl(code)}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={className || "w-5 h-[15px] rounded-sm object-cover shrink-0 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"}
    />
  );
}
