import GiftGroupManager from '@/components/admin/gift-groups/GiftGroupManager';

export const metadata = { title: 'Gift Groups | Admin' };

export default function GiftGroupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Gift Groups</h1>
        <p className="mt-1 text-gray-500">
          Offer optional gifts on product pages. Each group applies to the categories you choose, and
          its gifts appear on every product in those categories.
        </p>
      </div>
      <GiftGroupManager />
    </div>
  );
}
