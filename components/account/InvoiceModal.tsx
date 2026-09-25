'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Loader2, AlertCircle } from 'lucide-react';
import { useDialogA11y } from '@/hooks/useDialogA11y';
import { InvoiceDocument } from '@/components/invoice/InvoiceDocument';
import { downloadInvoicePdf } from '@/lib/invoice/download';
import { Skeleton } from '@/components/ui/Skeleton';
import type { InvoiceData } from '@/lib/invoice/types';

/**
 * The tax invoice as a popup over My Orders.
 *
 * It used to open /orders/[id]/invoice in a new tab. That route sits inside the (client) route
 * group, so the customer got the whole storefront around their invoice: the fixed navbar laid
 * over the top of the document, the cream page background behind the white A4 sheet, and the
 * footer under it. Showing the same document in a dialog is what makes it read as a document.
 *
 * The invoice is laid out at a fixed 210mm (A4 width, ~794px) because that is what makes the
 * PDF come out right. That is wider than a phone, so the sheet is scaled down to fit rather
 * than left to scroll sideways. The scale lives on a wrapper, never on the captured node, so
 * the downloaded PDF is always full size no matter what screen it was triggered from.
 */
export default function InvoiceModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [fit, setFit] = useState({ scale: 1, height: 0 });

  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose);
  const frameRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/invoice`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) throw new Error(json?.error || 'Could not load this invoice.');
        setData(json.invoice);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load this invoice.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // The page behind a modal must not scroll with it.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  /*
   * Scale the A4 sheet down to the width available, and give its wrapper the resulting visual
   * height: a CSS transform does not change layout size, so without this the dialog would
   * reserve the sheet's full unscaled height and leave a long blank run underneath it.
   */
  useEffect(() => {
    const frame = frameRef.current;
    const sheet = sheetRef.current;
    if (!data || !frame || !sheet) return;

    const measure = () => {
      const scale = Math.min(1, frame.clientWidth / sheet.offsetWidth);
      setFit({ scale, height: sheet.offsetHeight * scale });
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [data]);

  const download = async () => {
    const node = sheetRef.current?.querySelector<HTMLElement>('#invoice-printable-document');
    if (!node || !data) return;
    setDownloading(true);
    setError(null);
    try {
      await downloadInvoicePdf(node, data.invoiceNumber || data.orderNumber || 'INVOICE');
    } catch (e) {
      // No window.print() fallback here: printing from this dialog would print My Orders.
      console.error('[invoice] PDF export failed', e);
      setError('Could not build the PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Tax invoice"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 font-sans"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', damping: 26, stiffness: 240 }}
        className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#EEE] px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="text-[13px] font-medium uppercase tracking-[0.14em] text-primary">Tax Invoice</h3>
            {data && (
              <p className="mt-0.5 truncate text-[12px] text-[#999]">
                {data.invoiceNumber || data.orderNumber}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={download}
              disabled={!data || downloading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#61000B] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#7A000E] disabled:opacity-50"
            >
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>{downloading ? 'Preparing…' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close invoice"
              className="rounded-lg p-2 text-[#999] transition-colors hover:bg-[#F5F5F5] hover:text-primary"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* The only scrolling region: the dialog itself never grows past the viewport. */}
        <div
          ref={frameRef}
          className="min-h-0 flex-1 overflow-y-scroll overscroll-contain bg-[#F8F9FA] p-3 sm:p-5"
        >
          {error && (
            <div className="mx-auto flex max-w-md items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-4 text-[13px] text-red-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!data && !error && <Skeleton className="h-[60vh] w-full rounded-xl" />}

          {data && (
            <div style={{ height: fit.height || undefined }}>
              <div
                ref={sheetRef}
                style={{ width: '210mm', transform: `scale(${fit.scale})`, transformOrigin: 'top left' }}
              >
                <InvoiceDocument data={data} />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
