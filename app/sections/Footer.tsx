'use client'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
    <footer className="bg-[#F9EFE5] border-t border-secondary/10 pt-8 md:pt-16 pb-4 md:pb-8 px-4 md:px-12 text-secondary">
      <div className="max-w-[1280px] mx-auto">
        {/* Top Section */}
        <div className="max-w-md mx-auto text-center">
          {/* Crest Logo Image */}
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto flex items-center justify-center mb-2">
            <Image 
              src="/images/lebami.png"
              alt="LB Logo"
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-10 max-w-4xl mx-auto mt-8 md:mt-16 text-left md:text-center">
          {linkColumns.map((col, idx) => (
            <div key={idx} className="flex flex-col items-start md:items-center">
              <div className="text-left md:text-center inline-block">
                <h4 className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.15em] font-semibold mb-3 md:mb-4 text-secondary">
                  {col.title}
                </h4>
                <ul className="flex flex-col gap-1.5 md:gap-2">
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
        <div className="border-t border-secondary/10 mt-8 md:mt-14 pt-4 md:pt-6 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-[9px] md:text-[10px] text-secondary/60 font-sans uppercase tracking-widest">
          <p>© 2026 Lebami | All rights reserved</p>
          <div className="flex gap-4 md:gap-6">
            <Link href="#" className="hover:text-secondary transition-colors">Terms & Conditions - Privacy</Link>
            <span className="hidden md:inline">|</span>
            <Link href="#" className="hover:text-secondary transition-colors">Accessibility Statement</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
