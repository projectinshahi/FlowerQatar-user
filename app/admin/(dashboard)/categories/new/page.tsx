import CategoryForm from '@/components/admin/categories/CategoryForm';

export const metadata = {
  title: 'Add Category | Admin',
};

export default function AddCategoryPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Add New Category</h1>
        <p className="text-gray-500 mt-1">Create a new category for your products.</p>
      </div>
      <CategoryForm />
    </div>
  );
}
