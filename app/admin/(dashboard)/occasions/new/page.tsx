import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logDbError } from '@/lib/prisma-error';
import OccasionForm from '@/components/admin/occasions/OccasionForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Add Occasion | Admin',
};

export default async function NewOccasionPage() {
  /*
   * Only one occasion may exist. The list hides its "Add" button once there is one, but this
   * URL can still be typed or bookmarked — without this check the admin would fill in the
   * whole form only to be rejected with a 409 on save.
   */
  let existing: { id: string } | null = null;
  try {
    existing = await prisma.occasion.findFirst({ select: { id: true } });
  } catch (error) {
    // A read failure should not block the form; the API still enforces the limit on save.
    logDbError('admin/occasions/new.guard', error);
  }

  // Outside the try on purpose: `redirect()` works by throwing, and catching it here would
  // swallow the redirect and render the form anyway.
  if (existing) redirect('/admin/occasions');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Add Occasion</h1>
        <p className="mt-1 text-gray-500">Create the home page section and pick its products.</p>
      </div>
      <OccasionForm />
    </div>
  );
}
