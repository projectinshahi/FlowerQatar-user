import { AdminPageSkeleton, AdminTableCardSkeleton } from '@/components/skeletons/AdminSkeletons';

export default function Loading() {
  return (
    <AdminPageSkeleton>
      <AdminTableCardSkeleton rows={8} columns={['40%', '55%', '35%', '30%', '25%']} />
    </AdminPageSkeleton>
  );
}
