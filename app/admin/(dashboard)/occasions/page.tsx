import OccasionList from '@/components/admin/occasions/OccasionList';

export const metadata = {
  title: 'Occasion Management | Admin',
};

export default function OccasionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Occasions</h1>
        <p className="mt-1 text-gray-500">
          Curate home page sections and choose which products appear in each.
        </p>
      </div>
      <OccasionList />
    </div>
  );
}
