import { withHandler } from "@/lib/api/handler";
import { getExportOrders } from "@/lib/db/repositories/admin/orders.admin.repository";

const formatDate = (date: any): string => {
    if (!date) return "";
    try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? "" : d.toISOString();
    } catch {
        return "";
    }
};

export const GET = withHandler(
    async ({ req }): Promise<Response> => {
        const searchParams = req.nextUrl.searchParams;

        const paymentStatus = searchParams.get("payment") || undefined;
        const status = searchParams.get("status") || undefined;
        const searchValue = searchParams.get("search") || undefined;
        const startDate = searchParams.get("startDate") || undefined;
        const endDate = searchParams.get("endDate") || undefined;

        const filters = {
            paymentStatus,
            status: status === "all" ? undefined : status,
            search: searchValue,
            startDate,
            endDate,
        };

        // Headers
        const headers = [
            "Order Number",
            "Order Date",
            "Customer Name",
            "Customer Email",
            "Customer Phone",
            "Items Ordered",
            "Total Amount",
            "Payment Status",
            "Order Status",
            "AWB Number",
            "Shipping Status"
        ];

        const rows: string[][] = [headers];

        let page = 1;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
            const chunk = await getExportOrders({
                ...filters,
                page,
                limit,
            });

            if (chunk.length === 0) {
                hasMore = false;
                break;
            }

            for (const order of chunk) {
                rows.push([
                    order.order_number || "",
                    formatDate(order.created_at),
                    order.customer_name || "",
                    order.customer_email || "",
                    order.customer_phone || "",
                    order.items_ordered || "",
                    order.total ? String(Number(order.total)) : "0",
                    order.payment_status || "",
                    order.status || "",
                    order.awb_numbers || "",
                    order.shipping_statuses || ""
                ]);
            }

            if (chunk.length < limit) {
                hasMore = false;
            } else {
                page++;
            }
        }

        // Convert rows to CSV string with Excel UTF-8 BOM
        const csvContent = "\uFEFF" + rows.map(row => 
            row.map(val => {
                const str = String(val ?? "");
                const escaped = str.replace(/"/g, '""');
                if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
                    return `"${escaped}"`;
                }
                return escaped;
            }).join(",")
        ).join("\n");

        const dateStr = new Date().toISOString().slice(0, 10);
        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename=orders_export_${dateStr}.csv`,
                'Cache-Control': 'no-store, private',
            }
        });
    },
    { access: "admin" }
);
