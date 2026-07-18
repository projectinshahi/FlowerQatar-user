import OccasionForm from '@/components/admin/occasions/OccasionForm';

export const metadata = {
  title: 'Add Occasion | Admin',
};

export default function NewOccasionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Add Occasion</h1>
        <p className="mt-1 text-gray-500">Create a new home page section and pick its products.</p>
      </div>
      <OccasionForm />
    </div>
  );
}
