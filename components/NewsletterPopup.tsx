'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail } from 'lucide-react';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check if user has already seen this popup in this session
    const hasSeen = sessionStorage.getItem('v_newsletter_popup');
    if (hasSeen) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // clientY < 50 triggers when mouse leaves top of viewport (towards address bar)
      if (e.clientY < 50) {
        setIsOpen(true);
        sessionStorage.setItem('v_newsletter_popup', 'true');
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };

    // Delay binding the listener by a few seconds to let user settle in
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 4000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-white border border-divider p-8 md:p-12 shadow-2xl text-center flex flex-col items-center rounded-none"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-primary transition-colors duration-300"
              aria-label="Close dialog"
            >
              <X size={20} className="stroke-[1.5]" />
            </button>

            {/* Premium Header */}
            <span className="text-xs uppercase tracking-[0.25em] text-secondary font-light mb-3 block">
              Welcome to the World of
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary mb-4 leading-tight">
              Lebami Exclusive Club
</h2>
            <p className="text-muted text-sm mb-8 leading-relaxed max-w-sm">
              Subscribe to receive exclusive access to private collection drops, luxury gifting guides, and complimentary shipping on your first order.
            </p>

            {/* Form */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted/60">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-3 bg-cream border border-divider focus:border-secondary focus:outline-none text-sm font-sans tracking-wide transition-colors duration-300 rounded-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-secondary text-white uppercase text-xs tracking-[0.2em] font-medium transition-colors duration-500 rounded-none shadow-md"
                >
                  Join the Club
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-6 text-secondary font-medium tracking-wider text-sm"
              >
                Thank you. You have been added to our exclusive list.
              </motion.div>
            )}
            
            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 text-xs text-muted/80 hover:text-primary underline underline-offset-4 tracking-widest uppercase transition-colors"
            >
              No Thanks
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
