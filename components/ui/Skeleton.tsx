/**
 * Skeleton primitives.
 *
 * Deliberately NOT client components — they render no state and no effects, so pages and
 * `loading.tsx` files can use them without dragging JavaScript to the browser. The shimmer
 * itself is the `.skeleton` CSS class in globals.css (one keyframe for the whole app), which
 * also handles `prefers-reduced-motion`.
 *
 * Accessibility: a skeleton block is decorative, so it is hidden from assistive tech. Wrap a
 * whole loading region in `SkeletonRegion` to announce "loading" once instead of N times.
 */
import type { ReactNode } from 'react';

type Props = {
  className?: string;
  /** Inline width/height for sizes that vary per instance (e.g. a 62% wide text line). */
  style?: React.CSSProperties;
};

/** The base block. Everything else composes this. */
export function Skeleton({ className = '', style }: Props) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} style={style} />;
}

/**
 * Announces a loading region once, for screen readers, and hides the decorative blocks inside.
 * Use around any skeleton group that replaces real content.
 */
export function SkeletonRegion({
  children,
  label = 'Loading',
  className = '',
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** One line of body text. Height matches a 13–15px line so rows don't resize on swap. */
export function SkeletonText({ className = '', width }: Props & { width?: string }) {
  return <Skeleton className={`h-3.5 rounded-sm ${className}`} style={width ? { width } : undefined} />;
}

/**
 * A paragraph of `lines` text rows. The last row is short, the way real wrapped text ends —
 * without it a block of equal-length bars reads as a table, not a paragraph.
 */
export function SkeletonParagraph({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonText key={i} width={i === lines - 1 ? '62%' : '100%'} />
      ))}
    </div>
  );
}

/** A heading bar — taller than body text, matching the serif display sizes. */
export function SkeletonTitle({ className = '', width = '55%' }: Props & { width?: string }) {
  return <Skeleton className={`h-6 rounded-sm ${className}`} style={{ width }} />;
}

/**
 * An image placeholder that reserves the real aspect ratio, so swapping in the photo cannot
 * shift the page. `aspect` takes any Tailwind aspect utility.
 */
export function SkeletonImage({ className = '', aspect = 'aspect-square' }: Props & { aspect?: string }) {
  return <Skeleton className={`w-full ${aspect} ${className}`} />;
}

export function SkeletonAvatar({ className = 'h-10 w-10' }: Props) {
  return <Skeleton className={`rounded-full ${className}`} />;
}

/** Matches a real button's footprint so toolbars keep their height. */
export function SkeletonButton({ className = 'h-10 w-32' }: Props) {
  return <Skeleton className={`rounded-xl ${className}`} />;
}

/** One skeleton table row. `widths` sets each cell's bar width so columns look plausible. */
export function SkeletonRow({ widths, className = '' }: { widths: string[]; className?: string }) {
  return (
    <tr className={className}>
      {widths.map((width, i) => (
        <td key={i} className="p-4">
          <SkeletonText width={width} />
        </td>
      ))}
    </tr>
  );
}

