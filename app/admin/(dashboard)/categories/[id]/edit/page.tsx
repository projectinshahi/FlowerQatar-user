import CategoryForm from '@/components/admin/categories/CategoryForm';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Edit Category | Admin',
};

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const category = await prisma.category.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!category) {
    notFound();
  }

  // Convert dates and decimals if any (not needed for category schema as it's just basic types, 
  // but ensure date is not passed as object if crossing boundary, Next.js 14/15 handles this in RSC, 
  // but we can parse it to plain object just in case)
  
  const initialData = {
    id: category.id,
    name: category.name,
    image: category.image,
    imagePublicId: category.imagePublicId,
    exploreMore: category.exploreMore,
    hoverColor: category.hoverColor,
    status: category.status,
    displayOrder: category.displayOrder,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Edit Category</h1>
        <p className="text-gray-500 mt-1">Update category details and image.</p>
      </div>
      <CategoryForm initialData={initialData} isEdit />
    </div>
  );
}
