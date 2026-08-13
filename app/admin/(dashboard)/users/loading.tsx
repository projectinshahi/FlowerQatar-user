import { AdminPageSkeleton, AdminTableCardSkeleton } from '@/components/skeletons/AdminSkeletons';

export default function Loading() {
  return (
    <AdminPageSkeleton>
      <AdminTableCardSkeleton rows={8} withImage columns={['50%', '60%', '30%', '25%']} />
    </AdminPageSkeleton>
  );
}
