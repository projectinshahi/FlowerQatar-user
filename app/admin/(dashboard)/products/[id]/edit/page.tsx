import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/products/ProductForm";
import { getProductById } from "@/lib/actions/product.actions";
import { getAdminSubcategoryOptions } from "@/lib/subcategories";

export const metadata = {
  title: "Edit Product | Admin Dashboard",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch product and the subcategory options for the category selector.
  const [productResult, subcategories] = await Promise.all([
    getProductById(id),
    getAdminSubcategoryOptions(),
  ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  // Format data for the form
  const product = productResult.data;

  // Variants are stored as JSON already matching the form shape.
  const initialData = {
    id: product.id,
    name: product.name || "",
    slug: product.slug || "",
    sku: product.sku || "",
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    categoryType: product.categoryType || "",
    subcategoryId: product.subcategoryId || "",
    status: product.status,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
    isTrending: product.isTrending,
    isNewArrival: product.isNewArrival,
    variants: ((product.variants as any[]) || []).map((v: any) => ({
      id: v.id,
      variantName: v.variantName || "",
      sku: v.sku || "",
      description: v.description || "",
      productCare: {
        dos: v.productCare?.dos || [],
        donts: v.productCare?.donts || [],
      },
      isDefault: v.isDefault ?? false,
      isActive: v.isActive ?? true,
      specifications: (v.specifications || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        value: s.value,
      })),
      colorVariants: (v.colorVariants || []).map((cv: any) => ({
        id: cv.id,
        colorName: cv.colorName || "",
        colorCode: cv.colorCode || "#000000",
        price: cv.price ?? "",
        salePrice: cv.salePrice ?? "",
        swatchImage: cv.swatchImage || "",
        hoverImage: cv.hoverImage || "",
        isActive: cv.isActive ?? true,
        isDefault: cv.isDefault ?? false,
        galleryImages: (cv.galleryImages || []).map((img: any) => ({
          id: img.id,
          url: img.url,
          publicId: img.publicId,
          isPrimary: img.isPrimary,
          order: img.order,
        })),
      })),
    })),
  };

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
