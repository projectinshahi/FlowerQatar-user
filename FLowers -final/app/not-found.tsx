'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});

const montserrat = Montserrat({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export default function GlobalNotFound() {
  return (
    <main className={`${cormorant.variable} ${montserrat.variable} font-sans relative w-full h-screen flex items-center justify-center overflow-hidden bg-black text-white m-0 p-0`}>
      
      {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=2000" 
              alt="Beautiful dark floral background"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h1 className="font-serif text-8xl md:text-[150px] font-light tracking-widest text-primary/90 leading-none mb-4 drop-shadow-2xl">
                404
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h2 className="font-serif text-3xl md:text-5xl font-light mb-6 tracking-wide">
                Lost in the Garden
              </h2>
              <p className="font-sans text-sm md:text-base tracking-[0.15em] text-white/70 uppercase mb-12 max-w-md mx-auto leading-relaxed">
                The bloom you are looking for has either faded or been moved to a new arrangement.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Link 
                href="/" 
                className="group relative inline-flex items-center justify-center px-10 py-4 font-sans text-xs uppercase tracking-[0.2em] font-medium text-white overflow-hidden bg-primary/20 border border-primary/50 backdrop-blur-sm transition-all duration-500 hover:bg-primary"
              >
                <span className="relative z-10">Return to Home</span>
              </Link>
            </motion.div>
          </div>

          {/* Decorative Corner Flourishes */}
          <div className="absolute top-8 left-8 text-primary/30 font-serif text-2xl hidden md:block">✧</div>
          <div className="absolute top-8 right-8 text-primary/30 font-serif text-2xl hidden md:block">✧</div>
          <div className="absolute bottom-8 left-8 text-primary/30 font-serif text-2xl hidden md:block">✧</div>
          <div className="absolute bottom-8 right-8 text-primary/30 font-serif text-2xl hidden md:block">✧</div>
    </main>
  );
}
