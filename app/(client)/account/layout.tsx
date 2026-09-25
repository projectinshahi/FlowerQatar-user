import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/admin-guard";
import AccountSidebar from "@/components/account/AccountSidebar";
import { privatePageMetadata } from "@/lib/page-metadata";

// Signed-in area — never indexable.
export const metadata = privatePageMetadata("My Account");

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth guard: only signed-in users can reach any /account page.
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const displayName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;

  return (
    <div className="max-w-[1280px] mx-auto px-5 md:px-12 pb-10 md:pb-16 page-below-header">
      <h1 className="font-serif text-[30px] md:text-[42px] text-primary font-light tracking-[0.02em] mb-8 md:mb-10">
        My Account
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] gap-8 md:gap-14">
        <AccountSidebar displayName={displayName} email={user.email} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
