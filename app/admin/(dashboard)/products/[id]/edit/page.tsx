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
    categoryId: product.categoryId || "",
    brandId: product.brandId || "",
    status: product.status,
    variants: product.variants.map((v: any) => ({
      id: v.id,
      variantName: v.variantName,
      sku: v.sku,
      color: v.color || "",
      colorCode: v.colorCode || "#000000",
      material: v.material || "",
      price: Number(v.price),
      salePrice: v.salePrice ? Number(v.salePrice) : 0,
      isDefault: v.isDefault,
      isActive: v.isActive,
      description: v.description || "",
      details: v.details || "",
      productCare: v.productCare || "",
      hoverImage: v.hoverImage || "",
      videoUrl: v.videoUrl || "",
      swatchImage: v.swatchImage || "",
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
