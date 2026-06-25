import { okList, withHandler } from "@/lib/api/handler";
import { getOrderedItemsData } from "@/lib/db/repositories/user/orders.user.repository";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = withHandler(
    async ({ params, user }): Promise<NextResponse> => {

        const routeParams = await params;

        const orderId = routeParams?.id;
        const ownsOrder = await prisma.order.count({ where: { id: orderId, userId: user.id } });
        if (!ownsOrder) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });

        const itemsData = await getOrderedItemsData(orderId as string);

        const response = okList(itemsData, {})

        response.headers.set(
            "Cache-Control",
            "private, no-store"
        );

        return response;
    }, { access: "user" }
)
