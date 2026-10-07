import { getBanners } from "@/lib/actions/banner.actions";
import BannersManager from "@/components/admin/banners/BannersManager";

export const metadata = { title: "Banners | Admin" };
export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const res = await getBanners();
  const banners = res.success ? res.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Banner Videos</h1>
        <p className="text-gray-500 text-sm mt-1">Upload and manage the video banners shown on the storefront.</p>
      </div>
      {!res.success && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">{res.error}</div>
      )}
      <BannersManager initialBanners={banners} />
    </div>
  );
}
