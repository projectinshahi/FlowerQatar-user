"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productSchema, ProductFormValues } from "@/lib/validations/product";
import { Prisma, ProductStatus } from "@prisma/client";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/admin-guard";
import { logDbError, uniqueConstraintMessage } from "@/lib/prisma-error";
import { supportsCountry } from "@/lib/category-config";

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
        type: img.type || (img.url.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i) ? "video" : "image"),
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

/**
 * Column -> what the admin form calls it, so a constraint violation names a field they can see.
 *
 * `slug` is here for completeness only: both actions already resolve a slug clash by suffixing,
 * so it should never reach the database as a conflict. `sku` deliberately does NOT auto-resolve
 * — it is a real business identifier the admin chose, and silently saving
 * `FLW-CAL-MIN-01-1757570000000` instead would be worse than refusing.
 */
const PRODUCT_FIELD_LABELS = { sku: "SKU", slug: "URL slug", name: "name" };

/**
 * Turn a failed write into something worth showing an admin.
 *
 * A unique-constraint violation is the one database error that is the admin's to fix, so it gets
 * a specific message. Every other Prisma error is a fault on our side — the raw text carries
 * compiled module ids and absolute `.next/` paths — so it is logged with its code and reported
 * generically. Validation and other plain Errors keep their own message, which is already
 * written for a person.
 */
function productWriteError(error: unknown, fallback: string): string {
  const conflict = uniqueConstraintMessage(error, PRODUCT_FIELD_LABELS);
  if (conflict) return conflict;
  if (error instanceof Prisma.PrismaClientKnownRequestError) return fallback;
  return error instanceof Error ? error.message : fallback;
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

    // If subcategoryId is provided, ensure categoryType matches its parent category
    let resolvedCategoryType = parsed.categoryType || null;
    if (parsed.subcategoryId && !resolvedCategoryType) {
      const subcat = await prisma.subcategory.findUnique({
        where: { id: parsed.subcategoryId },
        include: { category: true },
      });
      if (subcat?.category?.name) {
        resolvedCategoryType = subcat.category.name as any;
      }
    }

    const product = await prisma.product.create({
      data: {
        name: productName,
        slug: finalSlug,
        sku: parsed.sku || null,
        shortDescription: parsed.shortDescription || null,
        description: parsed.description || null,
        // Cleared for any category that does not use sourcing origin. Without this, moving a
        // product out of Flower would leave a stale country stored — and the product page
        // renders it on truthiness, so it would keep showing with no field to edit it.
        country: supportsCountry(resolvedCategoryType) ? parsed.country || null : null,
        categoryType: resolvedCategoryType,
        subcategoryId: parsed.subcategoryId || null,
        status: parsed.status as ProductStatus,
        isFeatured: parsed.isFeatured,
        isBestSeller: parsed.isBestSeller,
        isTrending: parsed.isTrending,
        isNewArrival: parsed.isNewArrival,
        // `?? null`, not `|| null`: the schema already normalises a blank field to null, and
        // `||` would additionally swallow any falsy rating the admin actually chose.
        rating: parsed.rating ?? null,
        variants: buildVariantsJson(parsed.variants),
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/", "layout"); // homepage + category listings reflect the assignment
    return { success: true, data: product };
  } catch (error) {
    logDbError("createProduct", error);
    return { success: false, error: productWriteError(error, "Failed to create product") };
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

    // If subcategoryId is provided, ensure categoryType matches its parent category
    let resolvedCategoryType = parsed.categoryType || null;
    if (parsed.subcategoryId && !resolvedCategoryType) {
      const subcat = await prisma.subcategory.findUnique({
        where: { id: parsed.subcategoryId },
        include: { category: true },
      });
      if (subcat?.category?.name) {
        resolvedCategoryType = subcat.category.name as any;
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
        // Cleared for any category that does not use sourcing origin. Without this, moving a
        // product out of Flower would leave a stale country stored — and the product page
        // renders it on truthiness, so it would keep showing with no field to edit it.
        country: supportsCountry(resolvedCategoryType) ? parsed.country || null : null,
        categoryType: resolvedCategoryType,
        subcategoryId: parsed.subcategoryId || null,
        status: parsed.status as ProductStatus,
        isFeatured: parsed.isFeatured,
        isBestSeller: parsed.isBestSeller,
        isTrending: parsed.isTrending,
        isNewArrival: parsed.isNewArrival,
        // `?? null`, not `|| null`: the schema already normalises a blank field to null, and
        // `||` would additionally swallow any falsy rating the admin actually chose.
        rating: parsed.rating ?? null,
        variants: buildVariantsJson(parsed.variants),
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/product/${product.slug}`);
    revalidatePath("/", "layout"); // homepage + category listings reflect the assignment
    return { success: true, data: product };
  } catch (error) {
    logDbError("updateProduct", error);
    return { success: false, error: productWriteError(error, "Failed to update product") };
  }
}

export async function getProducts(params: {
  search?: string;
  status?: ProductStatus;
  subcategoryId?: string;
  /** Fixed category name (e.g. "FLOWER") — matches every product in any of its subcategories. */
  categoryName?: string;
  sortBy?: "newest" | "oldest" | "price_asc" | "price_desc" | "name_asc" | "stock_asc";
  page?: number;
  limit?: number;
}) {
  try {
    const { search, status, subcategoryId, categoryName, sortBy = "newest", page = 1, limit = 10 } = params;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (subcategoryId) where.subcategoryId = subcategoryId;
    else if (categoryName) where.subcategory = { category: { name: categoryName } };

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
        include: { subcategory: { include: { category: { select: { id: true, name: true } } } } },
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
      include: { subcategory: true },
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
      include: { subcategory: true },
    });

    if (!product) return { success: false, reason: "not_found" as const, error: "Product not found" };

    return { success: true as const, data: product };
  } catch (error) {
    // Surface the real Prisma code (P1001 connection / P2021 table / P2022 column …)
    // instead of hiding it behind a generic message.
    logDbError(`getProductBySlug(${slug})`, error);
    /*
     * `reason` separates "this product does not exist" from "the database was unreachable".
     * Both used to collapse into one falsy result, so a transient Neon blip rendered a
     * permanent-looking 404 for a product that exists — bad for the shopper mid-purchase, and
     * worse for a crawler, which treats it as the product being gone for good.
     */
    return { success: false, reason: "error" as const, error: "Failed to fetch product" };
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
            const resourceType = img.type === "video" ? "video" : "image";
            await deleteCloudinaryImage(img.publicId, resourceType).catch((err) =>
              console.error("Failed to delete Cloudinary media:", err)
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
