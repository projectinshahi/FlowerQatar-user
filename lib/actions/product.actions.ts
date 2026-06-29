"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ProductFormValues } from "@/lib/validations/product";
import { ProductStatus } from "@prisma/client";

export async function createProduct(data: ProductFormValues) {
  try {
    const product = await prisma.$transaction(async (tx: any) => {
      // Create product
      const newProduct = await tx.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          sku: data.sku,
          shortDescription: data.shortDescription,
          description: data.description,
          categoryId: data.categoryId || null,
          brandId: data.brandId || null,
          status: data.status as ProductStatus,
          isFeatured: data.isFeatured,
          isBestSeller: data.isBestSeller,
          isTrending: data.isTrending,
          isNewArrival: data.isNewArrival,
          basePrice: data.basePrice,
          salePrice: data.salePrice,
          comparePrice: data.comparePrice,
          costPrice: data.costPrice,
          taxClass: data.taxClass,
          
          seo: data.seo ? {
            create: {
              seoTitle: data.seo.seoTitle,
              metaDescription: data.seo.metaDescription,
              keywords: data.seo.keywords,
            }
          } : undefined,

          specifications: {
            create: data.specifications.map(spec => ({
              title: spec.title,
              value: spec.value
            }))
          },

          faqs: {
            create: data.faqs.map(faq => ({
              question: faq.question,
              answer: faq.answer
            }))
          },

          variants: {
            create: data.variants.map(variant => ({
              variantName: variant.variantName,
              sku: variant.sku,
              color: variant.color,
              colorCode: variant.colorCode,
              material: variant.material,
              size: variant.size,
              barcode: variant.barcode,
              weight: variant.weight,
              length: variant.length,
              width: variant.width,
              height: variant.height,
              price: variant.price,
              salePrice: variant.salePrice,
              stock: variant.stock,
              lowStockAlert: variant.lowStockAlert,
              isDefault: variant.isDefault,
              isActive: variant.isActive,
              images: {
                create: variant.images.map(img => ({
                  url: img.url,
                  publicId: img.publicId,
                  isPrimary: img.isPrimary,
                  isHover: img.isHover,
                  isGallery: img.isGallery,
                  order: img.order,
                }))
              }
            }))
          }
        }
      });

      return newProduct;
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true, data: product };
  } catch (error: any) {
    console.error("Failed to create product:", error);
    return { success: false, error: error.message || "Failed to create product" };
  }
}

export async function updateProduct(id: string, data: ProductFormValues) {
  try {
    const product = await prisma.$transaction(async (tx: any) => {
      // Delete existing relations first (simplest way to handle updates of nested arrays)
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productSpecification.deleteMany({ where: { productId: id } });
      await tx.productFAQ.deleteMany({ where: { productId: id } });
      await tx.productSEO.deleteMany({ where: { productId: id } });

      // Update product and recreate relations
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          sku: data.sku,
          shortDescription: data.shortDescription,
          description: data.description,
          categoryId: data.categoryId || null,
          brandId: data.brandId || null,
          status: data.status as ProductStatus,
          isFeatured: data.isFeatured,
          isBestSeller: data.isBestSeller,
          isTrending: data.isTrending,
          isNewArrival: data.isNewArrival,
          basePrice: data.basePrice,
          salePrice: data.salePrice,
          comparePrice: data.comparePrice,
          costPrice: data.costPrice,
          taxClass: data.taxClass,
          
          seo: data.seo ? {
            create: {
              seoTitle: data.seo.seoTitle,
              metaDescription: data.seo.metaDescription,
              keywords: data.seo.keywords,
            }
          } : undefined,

          specifications: {
            create: data.specifications.map(spec => ({
              title: spec.title,
              value: spec.value
            }))
          },

          faqs: {
            create: data.faqs.map(faq => ({
              question: faq.question,
              answer: faq.answer
            }))
          },

          variants: {
            create: data.variants.map(variant => ({
              variantName: variant.variantName,
              sku: variant.sku,
              color: variant.color,
              colorCode: variant.colorCode,
              material: variant.material,
              size: variant.size,
              barcode: variant.barcode,
              weight: variant.weight,
              length: variant.length,
              width: variant.width,
              height: variant.height,
              price: variant.price,
              salePrice: variant.salePrice,
              stock: variant.stock,
              lowStockAlert: variant.lowStockAlert,
              isDefault: variant.isDefault,
              isActive: variant.isActive,
              images: {
                create: variant.images.map(img => ({
                  url: img.url,
                  publicId: img.publicId,
                  isPrimary: img.isPrimary,
                  isHover: img.isHover,
                  isGallery: img.isGallery,
                  order: img.order,
                }))
              }
            }))
          }
        }
      });

      return updatedProduct;
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${data.slug}`);
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
  brandId?: string;
  sortBy?: "newest" | "oldest" | "price_asc" | "price_desc" | "name_asc" | "stock_asc";
  page?: number;
  limit?: number;
}) {
  try {
    const { search, status, categoryId, brandId, sortBy = "newest", page = 1, limit = 10 } = params;
    
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (status) {
      where.status = status;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (brandId) {
      where.brandId = brandId;
    }

    const orderBy: any = {};
    switch (sortBy) {
      case "newest": orderBy.createdAt = "desc"; break;
      case "oldest": orderBy.createdAt = "asc"; break;
      case "price_asc": orderBy.basePrice = "asc"; break;
      case "price_desc": orderBy.basePrice = "desc"; break;
      case "name_asc": orderBy.name = "asc"; break;
      default: orderBy.createdAt = "desc"; break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          brand: true,
          variants: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    return {
      success: true,
      data: {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
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
      include: {
        seo: true,
        specifications: true,
        faqs: true,
        variants: {
          include: {
            images: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!product) return { success: false, error: "Product not found" };

    return { success: true, data: product };
  } catch (error: any) {
    console.error("Failed to fetch product:", error);
    return { success: false, error: "Failed to fetch product" };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

export async function bulkUpdateProductStatus(ids: string[], status: ProductStatus) {
  try {
    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status }
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to bulk update products:", error);
    return { success: false, error: "Failed to bulk update products" };
  }
}

export async function bulkDeleteProducts(ids: string[]) {
  try {
    await prisma.product.deleteMany({
      where: { id: { in: ids } }
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to bulk delete products:", error);
    return { success: false, error: "Failed to bulk delete products" };
  }
}
