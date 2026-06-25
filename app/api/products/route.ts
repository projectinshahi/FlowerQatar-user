import { ok, withHandler } from "@/lib/api/handler";
import { readQuery } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withHandler(
  async ({ req }: { req: NextRequest }): Promise<NextResponse> => {
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category") ?? null;
    const search = searchParams.get("search") ?? null;
    const sort = searchParams.get("sort") ?? "newest";
    const minPrice = searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : null;
    const maxPrice = searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : null;
    const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
    const limit = Math.min(Number(searchParams.get("limit") ?? 12), 50);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (category) {
      values.push(Number(category));
      conditions.push(`p.category_id = $${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      conditions.push(`p.name ILIKE $${values.length}`);
    }
    if (minPrice !== null) {
      values.push(minPrice);
      conditions.push(`p.price >= $${values.length}`);
    }
    if (maxPrice !== null) {
      values.push(maxPrice);
      conditions.push(`p.price <= $${values.length}`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const orderMap: Record<string, string> = {
      newest: "p.created_at DESC",
      oldest: "p.created_at ASC",
      price_asc: "p.price ASC",
      price_desc: "p.price DESC",
      name_asc: "p.name ASC",
    };
    const orderBy = orderMap[sort] ?? "p.created_at DESC";

    const dataQuery = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.sale_price,
        p.category_id,
        p.weight,
        p.stock,
        p.sku,
        p.featured,
        p.images,
        c.title AS category_title
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${where}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM products p
      ${where}
    `;

    const [rows, countRows] = await Promise.all([
      readQuery<any>(dataQuery, values),
      readQuery<{ total: number }>(countQuery, values),
    ]);

    const total = countRows[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response = ok({
      data: rows,
      meta: { page, limit, total, totalPages },
    });

    response.headers.set("Cache-Control", "no-store");
    return response;
  },
  { access: "public" }
);
