import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/products/ProductForm";
import { getProductById } from "@/lib/actions/product.actions";
import { getAdminSubcategoryOptions } from "@/lib/subcategories";
import { productToFormValues } from "@/lib/validations/product";
import { requireAdminPage } from "@/lib/admin-guard";

export const metadata = {
  title: "Edit Product | Admin Dashboard",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;

  // Fetch product and the subcategory options for the category selector.
  const [productResult, subcategories] = await Promise.all([
    getProductById(id),
    getAdminSubcategoryOptions(),
  ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  const initialData = productToFormValues(productResult.data);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-500 text-sm mt-1">Update product details, variants, and settings.</p>
      </div>

      <ProductForm
        subcategories={subcategories}
        initialData={initialData}
      />
    </div>
  );
}
