import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import ProductTable from "@/components/admin/products/ProductTable";
import ProductForm from "@/components/admin/products/ProductForm";
import { getProducts, getProductById } from "@/lib/actions/product.actions";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Products | Admin Dashboard",
};

export default async function AdminProductsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = typeof searchParams.page === "string" ? Number(searchParams.page) : 1;
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
  const status = typeof searchParams.status === "string" ? searchParams.status as any : undefined;
  const sortBy = typeof searchParams.sortBy === "string" ? searchParams.sortBy as any : undefined;
  const isNew = searchParams.new === "true";
  const editId = typeof searchParams.edit === "string" ? searchParams.edit : undefined;

  if (isNew || editId) {
    const [categories, brands, editProductResult] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.brand.findMany({ orderBy: { name: 'asc' } }),
      editId ? getProductById(editId) : Promise.resolve(null)
    ]);

    let initialData = undefined;
    if (editId && editProductResult?.success && editProductResult.data) {
      const product = editProductResult.data;
      initialData = {
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
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900">{editId ? "Edit Product" : "Add New Product"}</h1>
            <p className="text-gray-500 text-sm mt-1">{editId ? "Update product details, variants, and settings." : "Create a new product with variants, pricing, and SEO details."}</p>
          </div>
          <Link href="/admin/products" className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors">
            Cancel
          </Link>
        </div>
        <ProductForm categories={categories} brands={brands} initialData={initialData} />
      </div>
    );
  }

  const result = await getProducts({ page, search, status, sortBy, limit: 10 });
  const products = result.success && result.data ? result.data.products : [];
  const pagination = result.success && result.data ? result.data.pagination : { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your store's products, variants, and inventory.</p>
        </div>
        <Link 
          href="/admin/products?new=true" 
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Filters (Simplified) */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search products..." 
            className="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            defaultValue={search}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-gray-900 outline-none bg-white"
            defaultValue={status || ""}
          >
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select 
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-gray-900 outline-none bg-white"
            defaultValue={sortBy || "newest"}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>

            <option value="name_asc">Name: A-Z</option>
          </select>
        </div>
      </div>

      <ProductTable products={products} pagination={pagination} />
    </div>
  );
}
