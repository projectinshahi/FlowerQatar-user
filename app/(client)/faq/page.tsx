import FaqPageClient from '@/components/faq/FaqPageClient';
import { getSubscriptionPlans } from '@/lib/subscription-plans';

// The membership cards show the real plans; admin plan edits purge this page (lib/live-sync.ts).
export default async function FaqPage() {
  return <FaqPageClient plans={await getSubscriptionPlans()} />;
}
