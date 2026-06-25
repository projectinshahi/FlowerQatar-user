import { ok, withHandler } from "@/lib/api/handler";
import { getPublicCategoryById } from "@/lib/db/repositories/public/category.public.repository";
import { NextResponse } from "next/server";

export const GET = withHandler(
    async ({ params }): Promise<NextResponse> => {
        const routeParams = await params;

        const categoryId = Number(routeParams?.id);
        const categoryData = await getPublicCategoryById(categoryId);

        if (!categoryData) {
            return ok({ data: null });
        }

        const response = ok({ data: categoryData });

        response.headers.set(
            "Cache-Control",
            "public, max-age=300, s-maxage=600"
        );

        return response;
    }
)