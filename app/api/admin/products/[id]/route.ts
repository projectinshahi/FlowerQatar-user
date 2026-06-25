import { ApiError } from "@/lib/api/errors";
import { err, ok, withHandler } from "@/lib/api/handler";
import { deleteFromCloudinary, uploadBase64ToCloudinary } from "@/lib/cloudinary.service";
import { withTransaction } from "@/lib/db";
import {
  deleteProduct,
  getAdminProductById,
  updateProduct,
} from "@/lib/db/repositories/admin/products.admin.repository";
import { getAdminCategoryById } from "@/lib/db/repositories/admin/category.admin.repository";
import { productApiSchema } from "@/schema/product.schema";
import { ProductImage } from "@/types/Admin/products.types";
import { NextResponse } from "next/server";

function parseId(raw: string | undefined): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function resolveImages(rawImages: unknown[]): Promise<ProductImage[]> {
  const resolved: ProductImage[] = [];

  for (const img of rawImages) {
    if (!img) continue;

    if (typeof img === "string") {
      if (img.startsWith("data:")) {
        resolved.push(await uploadBase64ToCloudinary(img, "product_images"));
        continue;
      }
      if (img.startsWith("https://")) {
        resolved.push({ url: img });
      }
      continue;
    }

    if (typeof img === "object" && img !== null && "url" in img) {
      const value = img as ProductImage & { previewUrl?: string };
      if (value.url?.startsWith("data:")) {
        resolved.push(
          await uploadBase64ToCloudinary(value.url, "product_images")
        );
      } else if (value.url) {
        resolved.push({
          url: value.url,
          public_id: value.public_id,
        });
      } else if (value.previewUrl?.startsWith("data:")) {
        resolved.push(
          await uploadBase64ToCloudinary(value.previewUrl, "product_images")
        );
      }
    }
  }

  return resolved;
}

export const GET = withHandler(
  async ({ params }): Promise<NextResponse> => {
    const routeParams = await params;
    const productId = parseId(routeParams?.id);

    if (!productId) {
      return err("Valid product ID is required", 400);
    }

    const product = await getAdminProductById(productId);
    if (!product) {
      return err("Product not found", 404);
    }

    const response = ok({ message: "Product found", data: product });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  },
  { access: "admin" }
);

export const PUT = withHandler(
  async ({ req, params }): Promise<NextResponse> => {
    const routeParams = await params;
    const productId = parseId(routeParams?.id);

    if (!productId) {
      return err("Valid product ID is required", 400);
    }

    const existing = await getAdminProductById(productId);
    if (!existing) {
      return err("Product not found", 404);
    }

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

    const oldPublicIds = new Set(
      existing.images
        .map((img) => img.public_id)
        .filter((id): id is string => Boolean(id))
    );
    const newPublicIds = new Set(
      parsed.data.images
        .map((img) => img.public_id)
        .filter((id): id is string => Boolean(id))
    );

    for (const publicId of oldPublicIds) {
      if (!newPublicIds.has(publicId)) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (error) {
          console.warn("[PUT product] Failed to delete old image:", error);
        }
      }
    }

    const updated = await updateProduct(productId, parsed.data);
    const response = ok({
      message: "Product updated successfully",
      data: updated,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  },
  { access: "admin" }
);

export const DELETE = withHandler(
  async ({ params }): Promise<NextResponse> => {
    const routeParams = await params;
    const productId = parseId(routeParams?.id);

    if (!productId) {
      return err("Valid product ID is required", 400);
    }

    try {
      const deleted = await withTransaction(async (client) => {
        const existing = await getAdminProductById(productId);
        if (!existing) {
          throw new ApiError("Product not found", 404);
        }

        for (const image of existing.images) {
          if (image.public_id) {
            try {
              await deleteFromCloudinary(image.public_id);
            } catch (error) {
              console.warn("[DELETE product] Failed to delete image:", error);
            }
          }
        }

        return deleteProduct(client, productId);
      });

      const response = ok({
        message: "Product deleted successfully",
        data: deleted,
      });
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        return err(error.message, error.status);
      }
      return err("Failed to delete product", 500);
    }
  },
  { access: "admin" }
);
