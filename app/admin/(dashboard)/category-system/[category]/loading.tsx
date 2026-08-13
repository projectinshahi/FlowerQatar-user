import { AdminPageSkeleton, AdminTableCardSkeleton } from '@/components/skeletons/AdminSkeletons';

export default function Loading() {
  return (
    <AdminPageSkeleton>
      <AdminTableCardSkeleton rows={6} withImage columns={['45%', '30%', '25%', '35%', '35%']} />
    </AdminPageSkeleton>
  );
}
