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
    <footer className="bg-cream pt-20 pb-10 px-4 md:px-12">
      {/* Top Section */}
      <div className="max-w-md mx-auto text-center">
        {/* Crest Logo (simplified SVG representation) */}
        <div className="w-20 h-20 mx-auto flex items-center justify-center border border-charcoal">
          <span className="font-serif text-3xl text-secondary tracking-widest">VF</span>
        </div>
        
        <h3 className="font-sans text-[11px] uppercase tracking-[0.2em] mt-6 text-secondary">
          STAY IN TOUCH
        </h3>
        
        {/* Email Input */}
        <form className="relative mt-8 group" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="EMAIL ADDRESS"
            className="w-full bg-transparent border-b border-charcoal/30 group-hover:border-charcoal pb-3 font-sans text-[11px] uppercase tracking-[0.15em] text-secondary placeholder:text-secondary/50 focus:outline-none focus:border-charcoal transition-colors duration-400"
            required
          />
          <button
            type="submit"
            className="absolute right-0 bottom-3 text-secondary hover:translate-x-1 transition-transform duration-300"
            aria-label="Submit email"
          >
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        </form>
      </div>

      {/* Link Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto mt-24 text-center md:text-left">
        {linkColumns.map((col, idx) => (
          <div key={idx} className="flex flex-col md:items-center">
            <div className="text-left md:text-center inline-block">
              <h4 className="font-sans text-[11px] uppercase tracking-[0.15em] font-medium mb-6 text-secondary">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href="#"
                      className="font-sans text-xs text-secondary/80 hover:text-secondary hover:opacity-60 transition-opacity duration-300 block"
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
      <div className="border-t border-charcoal/10 mt-20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-muted font-sans uppercase tracking-wider">
        <p>© 2023 Lebami | All rights reserved</p>
        <div className="flex gap-4">
          <Link href="#" className="hover:text-secondary transition-colors">Terms & Conditions - Privacy</Link>
          <span className="hidden md:inline">|</span>
          <Link href="#" className="hover:text-secondary transition-colors">Accessibility Statement</Link>
        </div>
      </div>
    </footer>
  )
}
