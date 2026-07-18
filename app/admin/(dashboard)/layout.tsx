import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/admin-guard";
import AdminShell from "@/components/admin/AdminShell";

/**
 * Server-side guard for the entire admin dashboard. Middleware only checks that a
 * session cookie is present (Edge cannot verify the JWT); this layout does the real
 * role check and redirects non-admins. All dashboard pages render inside AdminShell.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") redirect("/admin/login");

  return <AdminShell>{children}</AdminShell>;
}
