import { AdminPageSkeleton } from '@/components/skeletons/AdminSkeletons';

/** Fallback for every admin route that does not declare its own loading.tsx. */
export default function Loading() {
  return <AdminPageSkeleton />;
}
