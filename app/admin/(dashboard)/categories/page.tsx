import CategoryList from '@/components/admin/categories/CategoryList';

export const metadata = {
  title: 'Categories Management | Admin',
};

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Categories</h1>
        <p className="text-gray-500 mt-1">Manage product categories, images, and display settings.</p>
      </div>
      <CategoryList />
    </div>
  );
}
