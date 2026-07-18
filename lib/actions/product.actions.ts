"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productSchema, ProductFormValues } from "@/lib/validations/product";
import { ProductStatus } from "@prisma/client";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/admin-guard";
import { logDbError } from "@/lib/prisma-error";

/**
 * Normalizes the validated variants into the JSON shape stored on Product.variants.
 * Assigns stable ids to variants / color variants / gallery images so the storefront
 * and edit form can reference them.
 */
function buildVariantsJson(variants: ProductFormValues["variants"]) {
  return variants.map((variant) => ({
    id: variant.id || randomUUID(),
    variantName: variant.variantName,
    sku: variant.sku,
    description: variant.description ?? null,
    productCare: {
      dos: variant.productCare?.dos ?? [],
      donts: variant.productCare?.donts ?? [],
    },
    isDefault: variant.isDefault ?? false,
    isActive: variant.isActive ?? true,
    specifications: (variant.specifications || []).map((spec) => ({
      id: spec.id || randomUUID(),
      title: spec.title,
      value: spec.value,
    })),
    colorVariants: variant.colorVariants.map((cv) => ({
      id: cv.id || randomUUID(),
      colorName: cv.colorName,
      colorCode: cv.colorCode,
      price: cv.price,
      salePrice: cv.salePrice ?? null,
      swatchImage: cv.swatchImage || null,
      hoverImage: cv.hoverImage || null,
      isDefault: cv.isDefault ?? false,
      isActive: cv.isActive ?? true,
      galleryImages: (cv.galleryImages || []).map((img) => ({
        id: img.id || randomUUID(),
        url: img.url,
        publicId: img.publicId,
        isPrimary: img.isPrimary ?? false,
        order: img.order ?? 0,
      })),
    })),
  }));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createProduct(data: ProductFormValues) {
  try {
    await requireAdmin();
    const parsed = productSchema.parse(data);

    const productName =
      parsed.name || parsed.variants[0]?.variantName || "Untitled Product";
    let finalSlug = parsed.slug ? slugify(parsed.slug) : slugify(productName);

    // Ensure slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    const product = await prisma.product.create({
      data: {
        name: productName,
        slug: finalSlug,
        sku: parsed.sku || null,
        shortDescription: parsed.shortDescription || null,
        description: parsed.description || null,
        categoryId: parsed.categoryId || null,
        status: parsed.status as ProductStatus,
        isFeatured: parsed.isFeatured,
        isBestSeller: parsed.isBestSeller,
        isTrending: parsed.isTrending,
        isNewArrival: parsed.isNewArrival,
        variants: buildVariantsJson(parsed.variants),
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/"); // homepage New Arrivals reflects flag changes immediately
    return { success: true, data: product };
  } catch (error: any) {
    console.error("Failed to create product:", error);
    return { success: false, error: error.message || "Failed to create product" };
  }
}

export async function updateProduct(id: string, data: ProductFormValues) {
  try {
    await requireAdmin();
    const parsed = productSchema.parse(data);

    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Product not found" };
    }

    const productName =
      parsed.name || parsed.variants[0]?.variantName || "Untitled Product";

    // Resolve slug: keep current unless a new one is provided or the name changed
    let finalSlug = current.slug;
    if (parsed.slug && slugify(parsed.slug) !== current.slug) {
      finalSlug = slugify(parsed.slug);
    } else if (!parsed.slug && productName !== current.name) {
      finalSlug = slugify(productName);
    }

    if (finalSlug !== current.slug) {
      const clash = await prisma.product.findUnique({ where: { slug: finalSlug } });
      if (clash && clash.id !== id) {
        finalSlug = `${finalSlug}-${Date.now()}`;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: productName,
        slug: finalSlug,
        sku: parsed.sku || null,
        shortDescription: parsed.shortDescription || null,
        description: parsed.description || null,
        categoryId: parsed.categoryId || null,
        status: parsed.status as ProductStatus,
        isFeatured: parsed.isFeatured,
        isBestSeller: parsed.isBestSeller,
        isTrending: parsed.isTrending,
        isNewArrival: parsed.isNewArrival,
        variants: buildVariantsJson(parsed.variants),
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/product/${product.slug}`);
    revalidatePath("/"); // homepage New Arrivals reflects flag changes immediately
    return { success: true, data: product };
  } catch (error: any) {
    console.error("Failed to update product:", error);
    return { success: false, error: error.message || "Failed to update product" };
  }
}

export async function getProducts(params: {
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
  sortBy?: "newest" | "oldest" | "price_asc" | "price_desc" | "name_asc" | "stock_asc";
  page?: number;
  limit?: number;
}) {
  try {
    const { search, status, categoryId, sortBy = "newest", page = 1, limit = 10 } = params;

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    const orderBy: any = {};
    switch (sortBy) {
      case "newest": orderBy.createdAt = "desc"; break;
      case "oldest": orderBy.createdAt = "asc"; break;
      case "name_asc": orderBy.name = "asc"; break;
      default: orderBy.createdAt = "desc"; break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      success: true,
      data: {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) return { success: false, error: "Product not found" };

    return { success: true, data: product };
  } catch (error: any) {
    console.error("Failed to fetch product:", error);
    return { success: false, error: "Failed to fetch product" };
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });

    if (!product) return { success: false, error: "Product not found" };

    return { success: true, data: product };
  } catch (error) {
    // Surface the real Prisma code (P1001 connection / P2021 table / P2022 column …)
    // instead of hiding it behind a generic message.
    logDbError(`getProductBySlug(${slug})`, error);
    return { success: false, error: "Failed to fetch product" };
  }
}

export async function deleteProduct(id: string) {
  try {
    await requireAdmin();
    const product = await prisma.product.findUnique({ where: { id } });

    // Best-effort cleanup of gallery images from Cloudinary (they carry a publicId)
    const variants = (product?.variants as any[]) || [];
    for (const variant of variants) {
      for (const cv of variant?.colorVariants || []) {
        for (const img of cv?.galleryImages || []) {
          if (img?.publicId) {
            await deleteCloudinaryImage(img.publicId).catch((err) =>
              console.error("Failed to delete Cloudinary image:", err)
            );
          }
        }
      }
    }

    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

export async function bulkUpdateProductStatus(ids: string[], status: ProductStatus) {
  try {
    await requireAdmin();
    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to bulk update products:", error);
    return { success: false, error: "Failed to bulk update products" };
  }
}

export async function bulkDeleteProducts(ids: string[]) {
  try {
    await requireAdmin();
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to bulk delete products:", error);
    return { success: false, error: "Failed to bulk delete products" };
  }
}
