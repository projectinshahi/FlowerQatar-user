'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Search, Heart, User, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

const leftLinks = ['CONTACT US', 'BOUTIQUES']
const rightLinks = ['WISHLIST', 'SEARCH', 'ACCOUNT', 'CART']
const subNavLinks = ['FLOWERS', 'GIFTS', 'EXPLORE']
const mobileLinks = [...leftLinks, ...subNavLinks, ...rightLinks]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          isScrolled || isMobileMenuOpen ? 'bg-cream/95 backdrop-blur-md text-secondary' : 'bg-transparent text-white'
        }`}
      >
        <div className="h-[60px] px-4 md:px-12 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Left Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8 flex-1">
            {leftLinks.map((link) => (
              <NavLink key={link} href="#">{link}</NavLink>
            ))}
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center flex-1 md:flex-none">
            <Link href="/" className="flex items-center group">
              <span className="font-serif text-2xl font-light tracking-widest">LE</span>
              {/* <span className="font-serif italic text-sm mx-2 group-hover:text-secondary transition-colors duration-400">et</span> */}
              <span className="font-serif text-2xl font-light tracking-widest">BAMI</span>
            </Link>
          </div>

          {/* Right Links (Desktop) */}
          <div className="hidden md:flex items-center justify-end gap-8 flex-1">
            {rightLinks.map((link) => (
              <NavLink key={link} href="#">{link}</NavLink>
            ))}
          </div>

          {/* Mobile Cart Icon */}
          <button className="md:hidden">
            <ShoppingBag size={20} />
          </button>
        </div>

        {/* Sub Navigation (Desktop) */}
        <div className={`hidden md:flex justify-center pb-2 gap-8 ${isScrolled ? 'opacity-100' : 'opacity-100'} transition-opacity duration-500`}>
          {subNavLinks.map((link) => (
            <NavLink key={link} href="#">{link}</NavLink>
          ))}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-40 bg-cream pt-[100px] px-6 h-screen overflow-y-auto"
          >
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              className="flex flex-col items-center gap-8"
            >
              {mobileLinks.map((link) => (
                <motion.div
                  key={link}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
                  }}
                >
                  <Link
                    href="#"
                    className="font-sans text-lg uppercase tracking-[0.2em] text-secondary hover:text-secondary transition-colors duration-400"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link href={href} className="relative group font-sans text-[11px] uppercase tracking-[0.2em]">
      {children}
      <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-current scale-x-0 origin-center group-hover:scale-x-100 transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" />
    </Link>
  )
}
