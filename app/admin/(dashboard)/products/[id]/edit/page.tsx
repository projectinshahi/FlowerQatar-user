import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/products/ProductForm";
import { getProductById } from "@/lib/actions/product.actions";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Edit Product | Admin Dashboard",
};

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Fetch product, categories, and brands
  const [productResult, categories, brands] = await Promise.all([
    getProductById(id),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  // Format data for the form
  const product = productResult.data;
  
  // Create the initial data object matching the Zod schema exactly
  const initialData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku || "",
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    categoryId: product.categoryId || "",
    brandId: product.brandId || "",
    status: product.status,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
    isTrending: product.isTrending,
    isNewArrival: product.isNewArrival,
    basePrice: Number(product.basePrice),
    salePrice: product.salePrice ? Number(product.salePrice) : 0,
    comparePrice: product.comparePrice ? Number(product.comparePrice) : 0,
    costPrice: product.costPrice ? Number(product.costPrice) : 0,
    taxClass: product.taxClass || "",
    variants: product.variants.map((v: any) => ({
      id: v.id,
      variantName: v.variantName,
      sku: v.sku,
      color: v.color || "",
      colorCode: v.colorCode || "#000000",
      material: v.material || "",
      size: v.size || "",
      barcode: v.barcode || "",
      weight: v.weight ? Number(v.weight) : 0,
      length: v.length ? Number(v.length) : 0,
      width: v.width ? Number(v.width) : 0,
      height: v.height ? Number(v.height) : 0,
      price: Number(v.price),
      salePrice: v.salePrice ? Number(v.salePrice) : 0,
      stock: v.stock,
      lowStockAlert: v.lowStockAlert,
      isDefault: v.isDefault,
      isActive: v.isActive,
      images: v.images.map((img: any) => ({
        id: img.id,
        url: img.url,
        publicId: img.publicId,
        isPrimary: img.isPrimary,
        isHover: img.isHover,
        isGallery: img.isGallery,
        order: img.order,
      }))
    })),
    specifications: product.specifications.map((s: any) => ({
      id: s.id,
      title: s.title,
      value: s.value,
    })),
    faqs: product.faqs.map((f: any) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
    })),
    seo: product.seo ? {
      seoTitle: product.seo.seoTitle || "",
      metaDescription: product.seo.metaDescription || "",
      keywords: product.seo.keywords || "",
    } : { seoTitle: "", metaDescription: "", keywords: "" },
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-500 text-sm mt-1">Update product details, variants, and settings.</p>
      </div>

      <ProductForm 
        categories={categories} 
        brands={brands} 
        initialData={initialData} 
      />
    </div>
  );
}
