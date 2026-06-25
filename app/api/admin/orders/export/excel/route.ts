import { withHandler } from "@/lib/api/handler";
import { getExportOrders } from "@/lib/db/repositories/admin/orders.admin.repository";
import ExcelJS from "exceljs";

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

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Orders Export");

        // Freeze first row
        worksheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }
        ];

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
        
        worksheet.addRow(headers);

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
                worksheet.addRow([
                    order.order_number || "",
                    formatDate(order.created_at),
                    order.customer_name || "",
                    order.customer_email || "",
                    order.customer_phone || "",
                    order.items_ordered || "",
                    order.total ? Number(order.total) : 0,
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

        // Format Header Row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8DCC7' } // Light brand cream background (#e8dcc7)
        };
        headerRow.border = {
            top: { style: 'thin', color: { argb: 'FFD8CDB8' } },
            left: { style: 'thin', color: { argb: 'FFD8CDB8' } },
            bottom: { style: 'medium', color: { argb: 'FFA83A22' } }, // Medium primary border (#a83a22)
            right: { style: 'thin', color: { argb: 'FFD8CDB8' } }
        };

        // Auto-fit column widths
        worksheet.columns.forEach((column) => {
            let maxLen = 0;
            column.eachCell!({ includeEmpty: true }, (cell) => {
                const val = cell.value;
                const len = val ? String(val).length : 0;
                if (len > maxLen) {
                    maxLen = len;
                }
            });
            column.width = Math.max(maxLen + 4, 12);
        });

        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer();

        const dateStr = new Date().toISOString().slice(0, 10);
        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=orders_export_${dateStr}.xlsx`,
                'Cache-Control': 'no-store, private',
            }
        });
    },
    { access: "admin" }
);
