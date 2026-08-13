import { AdminStatsSkeleton, AdminChartSkeleton, AdminListSkeleton } from '@/components/skeletons/AdminSkeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <AdminStatsSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminChartSkeleton />
        <AdminChartSkeleton />
      </div>
      <AdminListSkeleton rows={5} />
    </div>
  );
}
