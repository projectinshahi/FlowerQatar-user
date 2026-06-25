import { err, ok, okList, withHandler } from "@/lib/api/handler";
import { uploadBase64ToCloudinary } from "@/lib/cloudinary.service";
import { withTransaction } from "@/lib/db";
import {
  createProduct,
  getAdminProducts,
} from "@/lib/db/repositories/admin/products.admin.repository";
import { getAdminCategoryById } from "@/lib/db/repositories/admin/category.admin.repository";
import { productApiSchema } from "@/schema/product.schema";
import { ProductImage } from "@/types/Admin/products.types";
import { NextResponse } from "next/server";

async function resolveImages(rawImages: unknown[]): Promise<ProductImage[]> {
  const resolved: ProductImage[] = [];

  for (const img of rawImages) {
    if (!img) continue;

    if (typeof img === "string") {
      if (img.startsWith("data:")) {
        const uploaded = await uploadBase64ToCloudinary(img, "product_images");
        resolved.push(uploaded);
        continue;
      }
      if (img.startsWith("https://")) {
        resolved.push({ url: img });
        continue;
      }
    }

    if (typeof img === "object" && img !== null && "url" in img) {
      const value = img as ProductImage & { previewUrl?: string };
      if (value.url?.startsWith("data:")) {
        const uploaded = await uploadBase64ToCloudinary(
          value.url,
          "product_images"
        );
        resolved.push(uploaded);
      } else if (value.url) {
        resolved.push({
          url: value.url,
          public_id: value.public_id,
        });
      } else if (value.previewUrl?.startsWith("data:")) {
        const uploaded = await uploadBase64ToCloudinary(
          value.previewUrl,
          "product_images"
        );
        resolved.push(uploaded);
      }
    }
  }

  return resolved;
}

export const GET = withHandler(
  async ({ req }): Promise<NextResponse> => {
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const search = searchParams.get("search") || undefined;
    const categoryParam = searchParams.get("category");
    const category =
      categoryParam && categoryParam !== "all"
        ? Number(categoryParam)
        : undefined;

    const products = await getAdminProducts({
      page,
      limit,
      search,
      category: Number.isInteger(category) ? category : undefined,
    });

    const response = okList(products.data, {
      pagination: products.pagination,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  },
  { access: "admin" }
);

export const POST = withHandler(
  async ({ req }): Promise<NextResponse> => {
    const body = await req.json();
    const rawImages = Array.isArray(body.images) ? body.images : [];

    let uploadedImages: ProductImage[] = [];
    try {
      uploadedImages = await resolveImages(rawImages);
    } catch (error) {
      return err(
        `Image upload failed: ${(error as Error).message}`,
        400
      );
    }

    const parsed = productApiSchema.safeParse({
      ...body,
      images: uploadedImages,
    });

    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const category = await getAdminCategoryById(parsed.data.category_id);
    if (!category) {
      return err("Selected category does not exist", 400);
    }

    const product = await withTransaction(async (client) =>
      createProduct(client, parsed.data)
    );

    const response = ok(
      { message: "Product created successfully", data: product },
      201
    );
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  },
  { access: "admin" }
);
