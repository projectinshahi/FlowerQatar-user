'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useApp } from '../../context/AppContext'

const leftLinks = ['CONTACT US', 'BOUTIQUES']
const subNavLinks = ['FLOWERS', 'GIFTS', 'EXPLORE']

const flowerCategories = [
  { name: 'SHOP ALL', image: '/images/category_bouquets_1782290106325.png' },
  { name: 'ROSES', image: '/images/category_bouquets_1782290106325.png' },
  { name: 'MIXED FLORALS', image: '/images/category_bouquets_1782290106325.png' },
  { name: 'SUMMER BLOOMS', image: '/images/category_bouquets_1782290106325.png' },
  { name: 'HYDRANGEAS', image: '/images/category_bouquets_1782290106325.png' },
  { name: 'PEONIES', image: '/images/category_bouquets_1782290106325.png' },
]

const flowerMenuLists = [
  {
    title: '',
    items: ['BEST SELLERS', 'NEW! EVIL EYE COLLECTION', 'NEW ARRIVALS', 'DESIGN YOUR OWN', 'SAME DAY DELIVERY - NEW YORK', 'SAME DAY DELIVERY - NEW JERSEY']
  },
  {
    title: 'FLOWERS BY VESSEL',
    items: ['Heirloom Wicker', 'Hat Box', 'Porcelain', 'Stone', 'NEW! Evil Eye Collection', 'Le Petit VEF Toile Print']
  },
  {
    title: 'BESPOKE COLLECTIONS',
    items: ['Long Stem Roses', 'Floral Frames', 'Flower Letters']
  },
  {
    title: 'SHOP BY COLOR',
    items: ['Yellow', 'Red', 'Pink', 'Lavender', 'White']
  }
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null)
  
  // Authenticated state
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  
  const { setCartOpen, setAccountOpen, setSearchOpen, user, setUser, addToast } = useApp()
  const pathname = usePathname()

  const isHomePage = pathname === '/'

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsAccountDropdownOpen(false);
      addToast('Successfully logged out.', 'info');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const rightLinks = ['WISHLIST', 'SEARCH', user ? 'MY ACCOUNT' : 'ACCOUNT', 'CART']

  return (
    <>
      <header
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setActiveMegaMenu(null); }}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          !isHomePage || isScrolled || isMobileMenuOpen || isHovered || activeMegaMenu !== null || isAccountDropdownOpen ? 'bg-cream/95 backdrop-blur-md text-secondary' : 'bg-transparent text-white'
        }`}
      >
        <div className="relative w-full px-4 md:px-12 pt-3 pb-3 flex flex-col justify-between">
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden absolute top-4 left-4 z-10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Cart Icon */}
          <button 
            className="md:hidden absolute top-4 right-4 z-10"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={20} />
          </button>

          {/* Top Left Links (Desktop) */}
          <div className="absolute top-4 left-4 md:left-12 hidden md:flex items-center gap-8 z-10">
            {leftLinks.map((link) => (
              <NavLink key={link} href="#">{link}</NavLink>
            ))}
          </div>

          {/* Top Right Links (Desktop) */}
          <div className="absolute top-4 right-4 md:right-12 hidden md:flex items-center gap-8 z-10">
            {rightLinks.map((link) => (
              <div key={link} className="relative group">
                <NavLink 
                  href={link === 'WISHLIST' ? '/wishlist' : '#'}
                  onClick={(e) => {
                    if (link === 'CART') {
                      e.preventDefault();
                      setCartOpen(true);
                    } else if (link === 'ACCOUNT') {
                      e.preventDefault();
                      setAccountOpen(true);
                    } else if (link === 'MY ACCOUNT') {
                      e.preventDefault();
                      setIsAccountDropdownOpen(!isAccountDropdownOpen);
                    } else if (link === 'SEARCH') {
                      e.preventDefault();
                      setSearchOpen(true);
                    }
                  }}
                >
                  {link}
                </NavLink>

                {/* Account Dropdown for Logged in Users */}
                {link === 'MY ACCOUNT' && (
                  <AnimatePresence>
                    {isAccountDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={(e) => { e.stopPropagation(); setIsAccountDropdownOpen(false); }} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 top-[30px] w-48 bg-cream border border-secondary/20 shadow-xl py-2 flex flex-col z-50"
                        >
                        <div className="px-5 py-3 border-b border-secondary/10 mb-2">
                          <p className="font-serif text-sm text-primary capitalize truncate">Hi, {user?.firstName}</p>
                        </div>
                        <Link href="#" className="px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors hover:bg-secondary/5">PROFILE</Link>
                        <Link href="#" className="px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors hover:bg-secondary/5">ORDERS</Link>
                        <button onClick={handleLogout} className="text-left px-5 py-2 mt-2 border-t border-secondary/10 text-[10px] uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors hover:bg-secondary/5 w-full">
                          LOGOUT
                        </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center justify-center mb-3 md:mb-4 z-0">
            <Link href="/" className="flex items-center group">
              <span className="font-serif text-3xl md:text-[36px] font-light tracking-[0.2em]">LEBAMI</span>
            </Link>
          </div>

          {/* Sub Navigation (Desktop) */}
          <div className={`hidden md:flex justify-center gap-16 md:gap-32 w-full z-10 transition-opacity duration-500`}>
            {subNavLinks.map((link) => (
              <div 
                key={link}
                onMouseEnter={() => {
                  if (link === 'FLOWERS') setActiveMegaMenu('FLOWERS')
                  else setActiveMegaMenu(null)
                }}
                onClick={() => {
                  if (link === 'FLOWERS') setActiveMegaMenu(activeMegaMenu === 'FLOWERS' ? null : 'FLOWERS')
                }}
                className="cursor-pointer"
              >
                <NavLink href="#">{link}</NavLink>
              </div>
            ))}
          </div>
        </div>

        {/* Mega Menu */}
        <AnimatePresence>
          {activeMegaMenu === 'FLOWERS' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="absolute top-full left-0 w-full bg-cream/95 backdrop-blur-md border-t border-secondary/20 shadow-lg text-secondary"
            >
              <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-5 md:py-6 flex flex-col">
                
                {/* Top Section: Images */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 justify-items-center pb-5 md:pb-6 border-b border-secondary/20">
                  {flowerCategories.map((cat, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 md:gap-3 cursor-pointer group">
                      <div className="w-[80px] h-[80px] md:w-[90px] md:h-[90px] rounded-full overflow-hidden border border-secondary/10 group-hover:scale-105 transition-transform duration-500">
                        <Image src={cat.image} alt={cat.name} width={90} height={90} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-sans text-[9px] md:text-[10px] text-center uppercase tracking-widest group-hover:text-primary transition-colors">{cat.name}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom Section: Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 pt-5 md:pt-6 px-2 md:px-4">
                  {flowerMenuLists.map((list, idx) => (
                    <div key={idx} className="flex flex-col gap-2 md:gap-3">
                      {list.title ? (
                        <h4 className="font-sans text-[10px] md:text-[11px] uppercase tracking-widest text-secondary mb-1">{list.title}</h4>
                      ) : (
                        <div className="hidden md:block h-[15px] mb-1"></div>
                      )}
                      <div className="flex flex-col gap-2 md:gap-3">
                        {list.items.map((item, itemIdx) => (
                          <Link 
                            key={itemIdx} 
                            href="#" 
                            className={`hover:text-primary transition-colors ${idx === 0 ? 'font-sans text-[9px] md:text-[10px] uppercase tracking-widest' : 'font-serif text-[13px] md:text-[15px]'}`}
                          >
                            {item}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              className="flex flex-col items-center gap-8 pb-20"
            >
              {[...leftLinks, ...subNavLinks, 'WISHLIST', 'SEARCH', 'CART'].map((link) => (
                <motion.div
                  key={link}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
                  }}
                >
                  <Link
                    href={link === 'WISHLIST' ? '/wishlist' : '#'}
                    className="font-sans text-lg uppercase tracking-[0.2em] text-secondary hover:text-secondary transition-colors duration-400"
                    onClick={(e) => {
                      if (link === 'CART') {
                        e.preventDefault();
                        setCartOpen(true);
                        setIsMobileMenuOpen(false);
                      } else if (link === 'SEARCH') {
                        e.preventDefault();
                        setSearchOpen(true);
                        setIsMobileMenuOpen(false);
                      } else if (link !== 'WISHLIST') {
                        setIsMobileMenuOpen(false);
                      } else {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                  >
                    {link}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Auth Section */}
              <div className="w-full border-t border-secondary/20 pt-8 mt-4 flex flex-col items-center gap-6">
                {!user ? (
                   <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                     <button
                       onClick={() => {
                         setAccountOpen(true);
                         setIsMobileMenuOpen(false);
                       }}
                       className="font-sans text-lg uppercase tracking-[0.2em] text-secondary hover:text-secondary transition-colors duration-400"
                     >
                       ACCOUNT
                     </button>
                   </motion.div>
                ) : (
                  <>
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                      <p className="font-serif text-xl text-primary capitalize mb-2 text-center">Hi, {user.firstName}</p>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                      <Link href="#" onClick={() => setIsMobileMenuOpen(false)} className="font-sans text-lg uppercase tracking-[0.2em] text-secondary hover:text-secondary transition-colors duration-400">
                        PROFILE
                      </Link>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                      <Link href="#" onClick={() => setIsMobileMenuOpen(false)} className="font-sans text-lg uppercase tracking-[0.2em] text-secondary hover:text-secondary transition-colors duration-400">
                        ORDERS
                      </Link>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                      <button onClick={handleLogout} className="font-sans text-lg uppercase tracking-[0.2em] text-secondary hover:text-secondary transition-colors duration-400">
                        LOGOUT
                      </button>
                    </motion.div>
                  </>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavLink({ href, children, onClick }: { href: string, children: React.ReactNode, onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <Link href={href} onClick={onClick} className="relative group font-sans text-[11px] uppercase tracking-[0.2em] pointer-events-none md:pointer-events-auto">
      {children}
      <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-current scale-x-0 origin-center group-hover:scale-x-100 transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" />
    </Link>
  )
}
