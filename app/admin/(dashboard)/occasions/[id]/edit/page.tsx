import OccasionForm from '@/components/admin/occasions/OccasionForm';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Edit Occasion | Admin',
};

export default async function EditOccasionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const occasion = await prisma.occasion.findUnique({
    where: { id },
    include: { products: { select: { productId: true } } },
  });

  if (!occasion) {
    notFound();
  }

  // Plain object across the RSC boundary; productIds pre-select the picker.
  const initialData = {
    id: occasion.id,
    title: occasion.title,
    subtitle: occasion.subtitle,
    description: occasion.description ?? '',
    bannerImage: occasion.bannerImage ?? '',
    buttonText: occasion.buttonText ?? '',
    buttonLink: occasion.buttonLink ?? '',
    isFeatured: occasion.isFeatured,
    displayOrder: occasion.displayOrder,
    isActive: occasion.isActive,
    productIds: occasion.products.map((p) => p.productId),
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Edit Occasion</h1>
        <p className="mt-1 text-gray-500">Update the details, banner and selected products.</p>
      </div>
      <OccasionForm initialData={initialData} isEdit />
    </div>
  );
}
