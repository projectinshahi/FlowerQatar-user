import { ok, withHandler } from "@/lib/api/handler";
import { getPublicProductById } from "@/lib/db/repositories/public/product.public.repository";
import { NextResponse } from "next/server";

interface Params {
    params: {
        id: string;
    };
}

export const GET = withHandler(
    async ({ params }): Promise<NextResponse> => {

        const routeParams = await params;

        const productId = Number(routeParams?.id);
        const productDetails = await getPublicProductById(productId);

        if (!productDetails) {
            return ok({ data: null });
        }

        const response = ok({ data: productDetails });

        response.headers.set(
            "Cache-Control",
            "public, max-age=300, s-maxage=600"
        );

        return response

    }, { access: "public" }
)