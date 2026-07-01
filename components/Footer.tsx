'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-primary pt-16 pb-8 px-6 md:px-12 lg:px-24 font-sans text-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
        
        {/* Column 1: Brand & About */}
        <div className="space-y-4">
          <div className="mb-4">
            <Image
              src="/images/lebami.png"
              alt="Lebami Logo"
              width={160}
              height={50}
              className="object-contain"
            />
          </div>
          <p className="text-xs text-white/80 leading-relaxed max-w-xs pt-2">
            The original designers of the Eternity® Rose. Handcrafted arrangements of real luxury roses, preserved to maintain their pristine beauty for a full year.
          </p>
          <div className="flex space-x-4 pt-4 text-white/80">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-soft transition-colors" aria-label="Instagram">
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-soft transition-colors" aria-label="Facebook">
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-soft transition-colors" aria-label="Twitter">
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
            </a>
          </div>
        </div>

        {/* Column 2: Customer Care */}
        <div className="space-y-4">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white">
            Customer Care
          </h4>
          <ul className="space-y-2 text-xs text-white/80 pt-2">
            <li>
              <Link href="/shipping-returns" className="hover:text-soft hover:underline underline-offset-4 transition-all">
                Shipping & Returns
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-soft hover:underline underline-offset-4 transition-all">
                Frequently Asked Questions
              </Link>
            </li>
            <li>
              <Link href="/care" className="hover:text-soft hover:underline underline-offset-4 transition-all">
                Eternity® Rose Care Guide
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-soft hover:underline underline-offset-4 transition-all">
                Contact & Support
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Boutique Locations */}
        <div className="space-y-4">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white">
            Our Ateliers
          </h4>
          <ul className="space-y-3 text-xs text-white/80 pt-2">
            <li>
              <span className="font-semibold text-white block">New York Flagship</span>
              143 Golden Plaza, Soho, NY 10012
            </li>
            <li>
              <span className="font-semibold text-white block">London Mayfair</span>
              42 New Bond St, London W1S 2RY
            </li>
            <li>
              <span className="font-semibold text-white block">Los Angeles Atelier</span>
              8500 Beverly Blvd, Los Angeles, CA 90048
            </li>
          </ul>
        </div>

        {/* Column 4: Newsletter Sign-up */}
        <div className="space-y-4">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white">
            Newsletter
          </h4>
          <p className="text-xs text-white/80 leading-relaxed pt-2">
            Sign up to receive first access to new colors, custom arrangement options, and store events.
          </p>
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="flex border-b border-white/20 py-1">
              <input
                type="email"
                required
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs bg-transparent border-none outline-none focus:ring-0 placeholder-white/50 text-white pr-4"
              />
              <button type="submit" className="text-white/80 hover:text-soft transition-colors">
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <span className="text-xs text-soft font-medium block pt-2">
              Subscription confirmed. Welcome.
            </span>
          )}
        </div>

      </div>

      {/* Divider */}
      <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap justify-center md:justify-start gap-6 text-[10px] uppercase tracking-widest text-white/80">
          <Link href="/shipping-returns" className="hover:text-soft">Privacy Policy</Link>
          <Link href="/shipping-returns" className="hover:text-soft">Terms of Service</Link>
          <Link href="/care" className="hover:text-soft">Care Guidelines</Link>
        </div>
        
        <div className="text-[10px] text-white/80 tracking-wider flex items-center gap-1">
          <span>© {new Date().getFullYear()} Lebami. All Rights Reserved.</span>
        </div>

        {/* Payment Icons */}
        <div className="flex items-center space-x-3 opacity-60">
          <span className="text-[9px] text-white/80 font-semibold tracking-wider mr-2 flex items-center gap-1">
            <ShieldCheck size={12} className="text-white" /> SECURE CHECKOUT
          </span>
          <div className="border border-white/20 px-1.5 py-0.5 rounded-none text-[8px] bg-white/10 font-mono text-white">AMEX</div>
          <div className="border border-white/20 px-1.5 py-0.5 rounded-none text-[8px] bg-white/10 font-mono text-white">VISA</div>
          <div className="border border-white/20 px-1.5 py-0.5 rounded-none text-[8px] bg-white/10 font-mono text-white">MC</div>
          <div className="border border-white/20 px-1.5 py-0.5 rounded-none text-[8px] bg-white/10 font-mono text-white">APPLE PAY</div>
        </div>
      </div>
    </footer>
  );
}
