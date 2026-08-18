import { Mail } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { logDbError } from '@/lib/prisma-error';
import ContactEnquiriesManager, {
  type Enquiry,
} from '@/components/admin/contact/ContactEnquiriesManager';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Contact Enquiries | Admin' };

/**
 * Timestamps are formatted HERE, on the server, and passed down as a finished string.
 *
 * Formatting in the client component used `Intl.DateTimeFormat(undefined, …)`, which resolves
 * the locale and time zone from whatever runtime it happens to run in — Node rendered
 * "12:22" and the browser "12:22 pm", so every row failed hydration. Locale and zone are now
 * both explicit, and the client does no formatting at all, so the two cannot disagree.
 *
 * Asia/Qatar because that is the storefront's market (prices are in QAR); change this one
 * constant if the team operates from elsewhere.
 */
const ADMIN_TIME_ZONE = 'Asia/Qatar';
const enquiryTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: ADMIN_TIME_ZONE,
});

async function getEnquiries(): Promise<Enquiry[]> {
  try {
    const rows = await prisma.contactEnquiry.findMany({
      // Newest first, and unread ahead of everything else at the same moment.
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      subject: r.subject,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      createdAtLabel: enquiryTime.format(r.createdAt),
    }));
  } catch (error) {
    // A database blip must not take the whole admin page down.
    logDbError('admin/contact-enquiries', error);
    return [];
  }
}

export default async function ContactEnquiriesPage() {
  const enquiries = await getEnquiries();
  const unread = enquiries.filter((e) => e.status === 'NEW').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
        <div className="rounded-xl bg-white p-2.5 text-[#A83A22] shadow-sm">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Contact Enquiries</h1>
          <p className="mt-1 text-sm text-gray-600">
            Messages sent from the storefront contact form.
            {unread > 0 && (
              <span className="ml-1 font-medium text-[#A83A22]">{unread} unread.</span>
            )}
          </p>
        </div>
      </div>

      <ContactEnquiriesManager enquiries={enquiries} />
    </div>
  );
}
