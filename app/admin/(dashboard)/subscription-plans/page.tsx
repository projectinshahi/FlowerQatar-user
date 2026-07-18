import SubscriptionPlansManager from '@/components/admin/subscription-plans/SubscriptionPlansManager';

export const metadata = {
  title: 'Subscription Plans | Admin',
};

export default function SubscriptionPlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="mt-1 text-gray-500">
          Edit the three fixed plans (Silver, Gold, Platinum). Plans can&apos;t be added or removed.
        </p>
      </div>
      <SubscriptionPlansManager />
    </div>
  );
}
