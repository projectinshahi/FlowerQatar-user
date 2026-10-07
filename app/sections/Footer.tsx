import Link from 'next/link'
import Image from 'next/image'
import { shopCategoryHref } from '@/lib/category-config'

/**
 * Footer navigation.
 *
 * Every entry carries the route it actually goes to. Labels whose page does not exist in this
 * app (Careers, Corporate Gifting, Terms, Accessibility Statement) are gone
 * rather than pointing at "#", which looked like a working link and did nothing.
 *
 * SOCIAL is absent for the same reason: no social profile URLs are configured anywhere in the
 * project, and inventing them would send customers to accounts that may not be the business's.
 * Add real URLs here and the column renders itself.
 */
export type FooterLink = { label: string; href: string; external?: boolean }

// Exported so the Blushing Blooms footer renders the same destinations without a second copy
// of the list — one edit here updates both footers.
export const linkColumns: { title: string; links: FooterLink[] }[] = [
  {
    title: "INFORMATION",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
  {
    title: "HELP",
    links: [
      { label: "Shipping and Returns", href: "/shipping-returns" },
      { label: "FAQs", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
      { label: "Flower Care", href: "/care" },
    ],
  },
  {
    title: "SHOP",
    /*
     * The three storefront categories, each going straight to its own listing.
     *
     * Built with shopCategoryHref() rather than typed out, so these stay correct if a category
     * slug is ever renamed - the same helper the navbar and every category tile already use.
     * Blushing Blooms resolves to ?category=blushing-blooms, which /shop hands to that
     * category's own dark page.
     */
    links: [
      { label: "Flowers", href: shopCategoryHref('FLOWER') },
      { label: "Gift Combos", href: shopCategoryHref('GIFT_COMBOS') },
      { label: "Blushing Blooms", href: shopCategoryHref('BLUSHING_BLOOMS') },
    ],
  },
]

/**
 * Where each column sits on desktop.
 *
 * The first hugs the left edge, the last mirrors it against the right, and anything between
 * them is centred - which puts HELP directly under the crest, since the crest is centred on the
 * same container. The two outer columns therefore sit the same distance in from their own edge,
 * which is the symmetry the row was missing when all three were centred together.
 *
 * Read by position rather than by column name, so the row stays balanced if a column is added
 * or removed. Full class strings, never assembled from fragments, so Tailwind still sees them.
 */
const COLUMN_ALIGN = {
  start: { box: 'md:items-start', text: 'md:text-left' },
  center: { box: 'md:items-center', text: 'md:text-center' },
  /*
   * The BLOCK is pushed to the right edge, but its text stays left-aligned. Right-aligned
   * text lines items up by their last letter, so Flowers / Gift Combos / Blushing Blooms
   * each began at a different x and the column read as ragged. Aligning the box instead of
   * the text keeps the mirror against the right edge and gives every entry one left edge,
   * exactly as the left-hand column has.
   */
  end: { box: 'md:items-end', text: 'md:text-left' },
} as const

/** Real social profiles only. Empty until the business supplies them. */
const socialLinks: { label: string; href: string }[] = []

export default function Footer() {
  return (
    <footer className="bg-[#F9EFE5] border-t border-secondary/10 pt-8 md:pt-16 pb-3 md:pb-8 px-4 md:px-12 text-secondary">
      <div className="max-w-[1280px] mx-auto">
        {/* Top Section */}
        <div className="max-w-md mx-auto text-center">
          {/* Crest Logo Image */}
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto flex items-center justify-center mb-2">
            <Image 
              src="/images/lebami.png"
              alt="Lebami"
              width={96}
              height={96}
              className="object-contain"
            />
          </div>
          

        </div>

        {/* Link Grid */}
        {/* Three columns at every width. On a phone they were two, which pushed SHOP onto a
            row of its own and left the footer with a tall empty half beside it. */}
        <div className="grid grid-cols-3 gap-x-3 gap-y-8 md:gap-10 mt-8 md:mt-16 text-left">
          {linkColumns.map((col, idx) => {
            const align =
              idx === 0
                ? COLUMN_ALIGN.start
                : idx === linkColumns.length - 1
                  ? COLUMN_ALIGN.end
                  : COLUMN_ALIGN.center
            return (
              <div key={idx} className={`flex flex-col items-start ${align.box}`}>
                <div className={`text-left ${align.text} inline-block`}>
                  <h4 className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.15em] font-semibold mb-3 md:mb-4 text-secondary">
                    {col.title}
                  </h4>
                  <ul className="flex flex-col gap-1.5 md:gap-2">
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="font-sans text-xs text-secondary/85 hover:text-secondary hover:translate-x-1 md:hover:translate-x-0 transition-all duration-300 block py-1"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Bar */}
        {/* Social icons render only once real profile URLs exist — see socialLinks above. */}
        {socialLinks.length > 0 && (
          <div className="mt-8 flex justify-center gap-6">
            {socialLinks.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.label} (opens in a new tab)`}
                className="text-secondary/85 hover:text-secondary transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}

        {/* Bottom Bar — the Terms and Accessibility links were removed: neither page exists,
            and a legal link that goes nowhere is worse than no link at all. */}
        <div
          data-footer-bar=""
          className="border-t border-secondary/10 mt-6 md:mt-14 pt-3 md:pt-6 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-[9px] md:text-[10px] text-secondary/80 font-sans uppercase tracking-widest"
        >
          <p>© 2026 Lebami | All rights reserved</p>
        
        </div>
      </div>
    </footer>
  )
}
