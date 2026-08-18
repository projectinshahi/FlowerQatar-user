'use client';

import { useState } from 'react';
import { Mail, Trash2, Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { subjectLabel } from '@/lib/contact-message';

export type Enquiry = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'NEW' | 'READ' | 'RESOLVED';
  /** ISO string — machine readable, for <time dateTime>. */
  createdAt: string;
  /**
   * Display string, already formatted on the server. Deliberately NOT formatted here:
   * Intl resolves locale and time zone from the runtime, so server and browser produced
   * different text and every row failed hydration.
   */
  createdAtLabel: string;
};

const STATUS_STYLE: Record<Enquiry['status'], string> = {
  NEW: 'bg-orange-50 text-[#A83A22] border-orange-200',
  READ: 'bg-blue-50 text-blue-700 border-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

/**
 * Enquiry inbox. The list itself is fetched on the server and passed in, so this only owns
 * the interactions (search, status, delete) and refreshes the server data afterwards rather
 * than keeping a second copy of it in client state.
 */
export default function ContactEnquiriesManager({ enquiries }: { enquiries: Enquiry[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const term = search.trim().toLowerCase();
  const visible = term
    ? enquiries.filter((e) =>
        [e.name, e.email, e.message, subjectLabel(e.subject)]
          .join(' ')
          .toLowerCase()
          .includes(term)
      )
    : enquiries;

  const setStatus = async (id: string, status: Enquiry['status']) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/contact-enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
      toast.success(status === 'RESOLVED' ? 'Marked as resolved' : 'Marked as read');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/contact-enquiries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      toast.success('Enquiry deleted');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  /** Opening an unread enquiry marks it read — the same affordance as an email client. */
  const toggle = (e: Enquiry) => {
    const next = openId === e.id ? null : e.id;
    setOpenId(next);
    if (next && e.status === 'NEW') setStatus(e.id, 'READ');
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or message…"
            // Form-filler extensions stamp `fdprocessedid` on inputs before hydration.
            suppressHydrationWarning
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-[#A83A22]"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-14 text-center shadow-sm">
          <Mail className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">
            {enquiries.length === 0
              ? 'No enquiries yet. Messages sent from the contact form appear here.'
              : 'No enquiries match your search.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((e) => {
            const open = openId === e.id;
            return (
              <li
                key={e.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggle(e)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-gray-50/70"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`font-medium text-gray-900 ${e.status === 'NEW' ? 'font-semibold' : ''}`}>
                        {e.name}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLE[e.status]}`}
                      >
                        {e.status}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                      {subjectLabel(e.subject)} · {e.email}
                    </span>
                  </span>
                  <time dateTime={e.createdAt} className="shrink-0 text-xs text-gray-400">
                    {e.createdAtLabel}
                  </time>
                </button>

                {open && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                    {/* whitespace-pre-wrap so the customer's own line breaks survive. */}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {e.message}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <a
                        href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: ${subjectLabel(e.subject)}`)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#A83A22] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#8e311d]"
                      >
                        <Mail className="h-3.5 w-3.5" /> Reply by email
                      </a>
                      {e.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          disabled={busyId === e.id}
                          onClick={() => setStatus(e.id, 'RESOLVED')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" /> Mark resolved
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === e.id}
                        onClick={() => remove(e.id)}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:border-red-300 hover:text-red-600 disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
