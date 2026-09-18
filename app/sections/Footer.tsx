'use client'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

/**
 * Footer navigation.
 *
 * Every entry carries the route it actually goes to. Labels whose page does not exist in this
 * app (Careers, Privacy Policy, Corporate Gifting, Terms, Accessibility Statement) are gone
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
      { label: "What Are Eternity Flowers?", href: "/about" },
      { label: "Blog", href: "/journal" },
      { label: "Press", href: "/press" },
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
    links: [
      { label: "All Products", href: "/shop" },
      { label: "Collections", href: "/collections" },
      { label: "Boutiques", href: "/boutiques" },
      { label: "Bespoke Orders", href: "/custom" },
    ],
  },
]

/** Real social profiles only. Empty until the business supplies them. */
const socialLinks: { label: string; href: string }[] = []

export default function Footer() {
  return (
    <footer className="bg-[#F9EFE5] border-t border-secondary/10 pt-8 md:pt-16 pb-4 md:pb-8 px-4 md:px-12 text-secondary">
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
          
          <h3 className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] mt-4 md:mt-5 text-secondary">
            STAY IN TOUCH
          </h3>
          
          {/* Email Input */}
          <form suppressHydrationWarning className="relative mt-4 md:mt-5 group max-w-sm mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input aria-label="Email address"
              suppressHydrationWarning
              type="email"
              placeholder="EMAIL ADDRESS"
              className="w-full bg-transparent border-b border-secondary/30 group-hover:border-secondary pb-3 font-sans text-[11px] uppercase tracking-[0.15em] text-secondary placeholder:text-secondary/50 focus:outline-none focus:border-secondary transition-colors duration-400"
              required
            />
            <button
              suppressHydrationWarning
              type="submit"
              className="absolute right-0 bottom-3 text-secondary hover:translate-x-1 transition-transform duration-300"
              aria-label="Submit email"
            >
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          </form>
        </div>

        {/* Link Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-10 mt-8 md:mt-16 text-left md:text-center">
          {linkColumns.map((col, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-start md:items-center${
                idx === linkColumns.length - 1 && linkColumns.length % 2 === 1
                  ? ' col-span-2 md:col-span-1'
                  : ''
              }`}
            >
              <div className="text-left md:text-center inline-block">
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
          ))}
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
          className="border-t border-secondary/10 mt-8 md:mt-14 pt-4 md:pt-6 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-[9px] md:text-[10px] text-secondary/80 font-sans uppercase tracking-widest"
        >
          <p>© 2026 Lebami | All rights reserved</p>
          <Link href="/contact" className="hover:text-secondary transition-colors">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  )
}
