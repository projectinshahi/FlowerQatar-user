/**
 * Admin-shaped skeletons. The admin design system is white cards on rounded-2xl borders with
 * the #A83A22 accent, so these mirror that rather than the storefront's cream/serif look.
 */
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonRegion,
  SkeletonText,
  SkeletonTitle,
} from '@/components/ui/Skeleton';

type RowProps = {
  rows?: number;
  /** One width per data column, e.g. ['55%','40%','30%']. */
  columns: string[];
  withImage?: boolean;
  withActions?: boolean;
};

/**
 * Just the `<tr>` elements — for tables that already own their `<tbody>` and only swap rows
 * while loading. Returning a fragment keeps the markup valid, since a `<tbody>` nested in a
 * `<tbody>` is not.
 */
export function AdminSkeletonRows({
  rows = 6,
  columns,
  withImage = false,
  withActions = true,
}: RowProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} aria-hidden="true">
          {withImage && (
            <td className="p-4">
              <Skeleton className="h-11 w-11 rounded-lg" />
            </td>
          )}
          {columns.map((width, c) => (
            <td key={c} className="p-4">
              <SkeletonText width={width} />
            </td>
          ))}
          {withActions && (
            <td className="p-4">
              <div className="flex items-center justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </td>
          )}
        </tr>
      ))}
    </>
  );
}

/**
 * Realistic table rows wrapped in their own `<tbody>`. `rows` defaults to 6 so the table
 * holds roughly its populated height.
 */
export function AdminTableSkeleton(props: RowProps) {
  return (
    <tbody className="divide-y divide-gray-100">
      <AdminSkeletonRows {...props} />
    </tbody>
  );
}

/**
 * Standalone card-wrapped table for pages that render their own container. Includes a header
 * strip so the skeleton reads as a table before any data exists.
 */
export function AdminTableCardSkeleton({
  rows = 6,
  columns,
  withImage = false,
}: {
  rows?: number;
  columns: string[];
  withImage?: boolean;
}) {
  const headerCells = (withImage ? 1 : 0) + columns.length + 1;
  return (
    <SkeletonRegion
      label="Loading table"
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              {Array.from({ length: headerCells }).map((_, i) => (
                <th key={i} className="p-4">
                  <SkeletonText className="h-2.5" width="60%" />
                </th>
              ))}
            </tr>
          </thead>
          <AdminTableSkeleton rows={rows} columns={columns} withImage={withImage} />
        </table>
      </div>
    </SkeletonRegion>
  );
}

/** A row of dashboard statistic tiles. */
export function AdminStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonRegion
      label="Loading statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <SkeletonText className="h-2.5" width="45%" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
          <Skeleton className="mt-4 h-7 w-24 rounded-sm" />
          <SkeletonText className="mt-2.5 h-2.5" width="60%" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

/** A chart panel: title, legend, then a plot area that reserves the real chart height. */
export function AdminChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <SkeletonRegion
      label="Loading chart"
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <SkeletonTitle className="h-5" width="180px" />
        <SkeletonButton className="h-8 w-28" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </SkeletonRegion>
  );
}

/**
 * An edit form waiting on its existing record. Renders label+input pairs so the page keeps
 * its height instead of showing an empty form that fills in later.
 */
export function AdminFormSkeleton({
  fields = 6,
  withImage = true,
}: {
  fields?: number;
  withImage?: boolean;
}) {
  return (
    <SkeletonRegion
      label="Loading form"
      className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
    >
      {withImage && (
        <div className="space-y-2">
          <SkeletonText className="h-2.5" width="22%" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonText className="h-2.5" width="26%" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <div className="space-y-2">
        <SkeletonText className="h-2.5" width="26%" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <SkeletonButton className="h-11 w-28" />
        <SkeletonButton className="h-11 w-32" />
      </div>
    </SkeletonRegion>
  );
}

/** A list of cards (orders, users, coupons) for pages that aren't tables. */
export function AdminListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <SkeletonRegion label="Loading list" className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <SkeletonAvatar className="h-11 w-11" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonText width="42%" />
            <SkeletonText className="h-2.5" width="24%" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

/** Page shell for admin routes: heading banner + content slot. */
export function AdminPageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonTitle className="h-6" width="30%" />
          <SkeletonText className="h-2.5" width="55%" />
        </div>
      </div>
      {children ?? <AdminTableCardSkeleton columns={['55%', '40%', '30%', '25%']} withImage />}
    </div>
  );
}
