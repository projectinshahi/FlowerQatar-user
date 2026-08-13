import { AdminPageSkeleton, AdminTableCardSkeleton } from '@/components/skeletons/AdminSkeletons';

export default function Loading() {
  return (
    <AdminPageSkeleton>
      <AdminTableCardSkeleton rows={8} withImage columns={['55%', '40%', '30%', '35%', '25%']} />
    </AdminPageSkeleton>
  );
}
