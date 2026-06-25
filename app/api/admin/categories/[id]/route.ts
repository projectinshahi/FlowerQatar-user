import { ApiError } from "@/lib/api/errors";
import { err, ok, withHandler } from "@/lib/api/handler";
import { withTransaction } from "@/lib/db";
import {
  categoryTitleExists,
  deleteCategory,
  getAdminCategoryById,
  updateCategory,
} from "@/lib/db/repositories/admin/category.admin.repository";
import { categoryApiSchema } from "@/schema/category.schema";
import { NextResponse } from "next/server";

function parseId(raw: string | undefined): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const PUT = withHandler(
  async ({ req, params }): Promise<NextResponse> => {
    const routeParams = await params;
    const categoryId = parseId(routeParams?.id);

    if (!categoryId) {
      return err("Valid category ID is required", 400);
    }

    const existing = await getAdminCategoryById(categoryId);
    if (!existing) {
      return err("Category not found", 404);
    }

    const body = await req.json();
    const parsed = categoryApiSchema.safeParse(body);

    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const duplicate = await categoryTitleExists(parsed.data.title, categoryId);
    if (duplicate) {
      return err("A category with this title already exists", 409);
    }

    const updated = await updateCategory(categoryId, parsed.data);
    const response = ok({
      message: "Category updated successfully",
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
    const categoryId = parseId(routeParams?.id);

    if (!categoryId) {
      return err("Valid category ID is required", 400);
    }

    try {
      const deleted = await withTransaction(async (client) => {
        const existing = await getAdminCategoryById(categoryId);
        if (!existing) {
          throw new ApiError("Category not found", 404);
        }
        return deleteCategory(client, categoryId);
      });

      const response = ok({
        message: "Category deleted successfully",
        data: deleted,
      });
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        return err(error.message, error.status);
      }

      const message =
        (error as { code?: string }).code === "23503"
          ? "Cannot delete category while products are assigned to it"
          : "Failed to delete category";

      return err(message, 400);
    }
  },
  { access: "admin" }
);
