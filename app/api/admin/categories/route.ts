import { err, ok, okList, withHandler } from "@/lib/api/handler";
import { withTransaction } from "@/lib/db";
import {
  categoryTitleExists,
  createCategory,
  getAdminCategories,
} from "@/lib/db/repositories/admin/category.admin.repository";
import { categoryApiSchema } from "@/schema/category.schema";
import { NextResponse } from "next/server";

export const GET = withHandler(
  async ({ req }): Promise<NextResponse> => {
    const search = req.nextUrl.searchParams.get("search") || undefined;
    const categories = await getAdminCategories({ search });
    const response = okList(categories, {});
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  },
  { access: "admin" }
);

export const POST = withHandler(
  async ({ req }): Promise<NextResponse> => {
    const body = await req.json();
    const parsed = categoryApiSchema.safeParse(body);

    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const exists = await categoryTitleExists(parsed.data.title);
    if (exists) {
      return err("A category with this title already exists", 409);
    }

    const category = await withTransaction(async (client) =>
      createCategory(client, parsed.data)
    );

    const response = ok(
      { message: "Category created successfully", data: category },
      201
    );
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  },
  { access: "admin" }
);
