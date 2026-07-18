import { NextResponse } from "next/server";
import { fail, withUser } from "@/lib/api";
import { buildDataExport } from "@/lib/gdpr";

// GET /api/account/export — GDPR "download my data" (owner only, downloadable JSON).
export const GET = withUser(async ({ user }) => {
  const data = await buildDataExport(user.id);
  if (!data) return fail("User not found", 404);

  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lebami-data-${user.id}.json"`,
      "Cache-Control": "no-store",
    },
  });
});
