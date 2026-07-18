import WelcomePopupForm from '@/components/admin/welcome-popup/WelcomePopupForm';

export const metadata = {
  title: 'Welcome Popup | Admin',
};

export default function WelcomePopupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Welcome Popup</h1>
        <p className="mt-1 text-gray-500">Manage the welcome dialog shown to visitors once per browser session.</p>
      </div>
      <WelcomePopupForm />
    </div>
  );
}
