import { SITE_NAME } from '@/lib/site';

/**
 * Floating WhatsApp contact button.
 *
 * Server component on purpose: it has no state and no effects, so it ships zero JavaScript —
 * hover, focus and the label reveal are all CSS.
 *
 * The number comes from NEXT_PUBLIC_WHATSAPP_NUMBER. If it is unset the button renders
 * nothing at all, because a contact button that opens an empty or invented chat is worse
 * than no button: customers would think they had messaged the business when they had not.
 */

/** wa.me wants digits only — no +, spaces, dashes or parentheses. */
const toWaNumber = (raw: string) => raw.replace(/\D/g, '');

export default function WhatsAppButton({
  message = `Hello ${SITE_NAME}, I'd like to ask about your arrangements.`,
}: {
  message?: string;
}) {
  const number = toWaNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '');
  // A country code plus a subscriber number is at least 8 digits; anything shorter is a
  // half-filled placeholder rather than a real line.
  if (number.length < 8) return null;

  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  /*
   * z-40 puts this above the page and below anything modal (drawers and dialogs start at z-50).
   *
   * At z-[60] it floated over all of them: measured on a 390px screen the bubble spans x318-370
   * against a filter-drawer Apply button that ends at x326, and it sits on the cart drawer's
   * Checkout button the same way. Nothing else moves — it is bottom-right and the only other
   * z-50 element, the header, is at the top of the page.
   */
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp (opens WhatsApp in a new tab)"
      data-whatsapp-fab=""
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-0 rounded-full bg-primary p-3.5 text-cream shadow-[0_10px_30px_-8px_rgba(97,0,11,0.55)] outline-none transition-[background-color,gap,padding,box-shadow] duration-300 ease-out hover:bg-secondary hover:gap-2 hover:pr-5 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 md:bottom-8 md:right-8 motion-reduce:transition-none"
    >
      {/*
        WhatsApp glyph as inline SVG — lucide-react dropped brand icons, and this avoids
        pulling in an icon package for a single mark. `currentColor` keeps it on the site
        palette (cream on maroon) instead of WhatsApp green.
      */}
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        className="h-6 w-6 shrink-0"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.82 11.82 0 0 0 20.464 3.488" />
      </svg>

      {/*
        Label expands on hover/focus on pointer devices. Kept out of the accessibility tree
        (the anchor already has a full aria-label) and hidden on small screens, where it
        would crowd the viewport.
      */}
      <span
        aria-hidden="true"
        className="hidden max-w-0 overflow-hidden whitespace-nowrap font-sans text-[11px] font-medium uppercase tracking-[0.14em] opacity-0 transition-[max-width,opacity] duration-300 ease-out group-hover:max-w-[140px] group-hover:opacity-100 group-focus-visible:max-w-[140px] group-focus-visible:opacity-100 md:inline"
      >
        Chat with us
      </span>
    </a>
  );
}
