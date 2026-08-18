import { redirect } from "next/navigation";
import { DatabaseZap } from "lucide-react";
import { getCurrentUser } from "@/lib/admin-guard";
import { isDbUnreachable, logDbError } from "@/lib/prisma-error";
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
  let user;
  try {
    user = await getCurrentUser();
  } catch (error) {
    /*
     * A database outage is NOT a failed sign-in.
     *
     * getCurrentUser has to hit the database to resolve the session, so when the database is
     * unreachable it throws and this layout used to crash with a raw Prisma stack trace.
     * Redirecting to /admin/login instead would be worse: the admin is still signed in, and
     * the login page needs the same database, so they would be stuck in a loop being told
     * their credentials are wrong. Say what actually happened instead.
     */
    if (!isDbUnreachable(error)) throw error;
    logDbError("AdminDashboardLayout.getCurrentUser", error);

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 w-fit rounded-xl bg-orange-50 p-3 text-[#A83A22]">
            <DatabaseZap className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-xl font-bold text-gray-900">Can&apos;t reach the database</h1>
          <p className="mt-2 text-sm text-gray-600">
            You are still signed in — the admin panel just cannot connect to the database right
            now. This is usually a network or DNS problem rather than anything wrong with your
            account.
          </p>
          {/*
            A plain anchor on purpose, not next/link: this needs a full document request so
            the server component re-runs against the database. A client navigation can be
            served from the router cache and would "succeed" without retrying anything.
          */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/admin/dashboard"
            className="mt-6 inline-block rounded-xl bg-[#A83A22] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#8e311d]"
          >
            Try again
          </a>
        </div>
      </div>
    );
  }

  if (!user) redirect("/admin/login");
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") redirect("/admin/login");

  return <AdminShell>{children}</AdminShell>;
}
