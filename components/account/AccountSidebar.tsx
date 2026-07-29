"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, MapPin, Repeat, Package, LogOut } from "lucide-react";
import { useApp } from "../../context/AppContext";

const links = [
  { href: "/account/profile", label: "My Profile", icon: User },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/addresses", label: "Saved Addresses", icon: MapPin },
  { href: "/account/subscriptions", label: "Subscriptions", icon: Repeat },
];

export default function AccountSidebar({ displayName, email }: { displayName: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setUser, addToast } = useApp();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      addToast("You have been signed out.", "info");
      router.push("/");
      router.refresh();
    } catch {
      addToast("Could not sign out. Please try again.", "error");
    }
  };

  return (
    <aside className="md:sticky md:top-24 h-max">
      <div className="mb-6 pb-6 border-b border-[#EAEAEA]">
        <p className="font-serif text-[18px] text-primary truncate">{displayName}</p>
        <p className="text-[12px] text-[#888] truncate mt-0.5">{email}</p>
      </div>
      <nav className="flex md:flex-col gap-1.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-3 text-[12px] uppercase tracking-[0.12em] transition-colors ${
                active ? "bg-primary text-white" : "text-[#666] hover:bg-[#F5F5F5] hover:text-primary"
              }`}
            >
              <Icon size={16} className={active ? "text-white" : "text-[#999]"} />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 text-[12px] uppercase tracking-[0.12em] text-red-500 hover:bg-red-50 transition-colors mt-1"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </nav>
    </aside>
  );
}
