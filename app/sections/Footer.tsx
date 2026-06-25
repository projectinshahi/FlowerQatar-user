'use client'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const linkColumns = [
  {
    title: "INFORMATION",
    links: [
      "What Are Eternity Flowers?",
      "Blog",
      "Press",
      "Corporate Gifting Events",
      "Careers"
    ]
  },
  {
    title: "HELP",
    links: [
      "Shipping and Returns",
      "FAQs",
      "Contact Us",
      "Privacy Policy"
    ]
  },
  {
    title: "SOCIAL",
    links: [
      "Instagram",
      "Tik Tok",
      "Pinterest",
      "Youtube",
      "Facebook",
      "Twitter"
    ]
  }
]

export default function Footer() {
  return (
    <footer className="bg-[#F9EFE5] border-t border-secondary/10 pt-16 md:pt-24 pb-8 md:pb-10 px-4 md:px-12 text-secondary">
      {/* Top Section */}
      <div className="max-w-md mx-auto text-center">
        {/* Crest Logo (simplified SVG representation) */}
        <div className="w-20 h-20 mx-auto flex items-center justify-center border border-secondary/30 rounded-full">
          <span className="font-serif text-3xl text-secondary tracking-widest">LB</span>
        </div>
        
        <h3 className="font-sans text-[11px] uppercase tracking-[0.2em] mt-8 text-secondary">
          STAY IN TOUCH
        </h3>
        
        {/* Email Input */}
        <form suppressHydrationWarning className="relative mt-8 group max-w-sm mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-16 max-w-5xl mx-auto mt-16 md:mt-24 text-left md:text-center">
        {linkColumns.map((col, idx) => (
          <div key={idx} className="flex flex-col items-start md:items-center">
            <div className="text-left md:text-center inline-block">
              <h4 className="font-sans text-[11px] uppercase tracking-[0.15em] font-semibold mb-6 text-secondary">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-4">
                {col.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href="#"
                      className="font-sans text-xs text-secondary/70 hover:text-secondary hover:translate-x-1 md:hover:translate-x-0 transition-all duration-300 block"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-secondary/10 mt-16 md:mt-24 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-secondary/60 font-sans uppercase tracking-widest">
        <p>© 2026 Lebami | All rights reserved</p>
        <div className="flex gap-4 md:gap-6">
          <Link href="#" className="hover:text-secondary transition-colors">Terms & Conditions - Privacy</Link>
          <span className="hidden md:inline">|</span>
          <Link href="#" className="hover:text-secondary transition-colors">Accessibility Statement</Link>
        </div>
      </div>
    </footer>
  )
}
