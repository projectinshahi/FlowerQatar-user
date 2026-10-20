import Link from 'next/link'
import Image from 'next/image'
import { shopCategoryHref } from '@/lib/category-config'

/**
 * Footer navigation.
 *
 * Every entry carries the route it actually goes to. Labels whose page does not exist in this
 * app (Careers, Corporate Gifting, Terms, Accessibility Statement) are gone
 * rather than pointing at "#", which looked like a working link and did nothing.
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

/** The business's social profiles. Icons are the official Simple Icons glyphs (CC0, 24×24). */
const socialLinks: { label: string; href: string; path: string }[] = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/lebami_qatar?obrf=MXY0OTR6NjdoYnF3bw%3D%3D',
    path: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/LebamiQatar',
    path: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  },
  {
    label: 'Snapchat',
    // The link supplied for Snapchat is the Instagram profile; swap in the Snapchat URL when there is one.
    href: 'https://www.snapchat.com/explore/lebami_qa',
    path: 'M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z',
  },
]

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

        {/* Social icons, centred above the bottom bar */}
        {socialLinks.length > 0 && (
          <div className="mt-8 md:mt-12 flex justify-center gap-4 md:gap-5">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.label} (opens in a new tab)`}
                title={s.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-secondary/20 text-secondary/85 transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-[#F9EFE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9EFE5]"
              >
                <svg viewBox="0 0 24 24" className="size-4.5 fill-current" aria-hidden="true">
                  <path d={s.path} />
                </svg>
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
