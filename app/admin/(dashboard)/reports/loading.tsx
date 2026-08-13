import { AdminStatsSkeleton, AdminChartSkeleton } from '@/components/skeletons/AdminSkeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <AdminStatsSkeleton />
      <AdminChartSkeleton />
    </div>
  );
}
