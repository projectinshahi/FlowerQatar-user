import DeliveryChargeForm from '@/components/admin/delivery-charge/DeliveryChargeForm';

export const metadata = {
  title: 'Delivery Charge | Admin',
};

export default function DeliveryChargePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Delivery Charge</h1>
        <p className="mt-1 text-gray-500">Manage the single, global delivery charge applied across the store.</p>
      </div>
      <DeliveryChargeForm />
    </div>
  );
}
