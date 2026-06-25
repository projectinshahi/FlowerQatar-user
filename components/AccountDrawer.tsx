'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Link from 'next/link';

export default function AccountDrawer() {
  const { isAccountOpen, setAccountOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'signIn' | 'createAccount'>('signIn');

  return (
    <AnimatePresence>
      {isAccountOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAccountOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col rounded-none"
            >
              {/* Header */}
              <div className="px-5 md:px-6 py-4 bg-[#F8F8F8] flex items-center justify-start border-b border-[#EAEAEA]">
                <button
                  onClick={() => setAccountOpen(false)}
                  className="text-primary hover:text-secondary transition-colors rounded-none mr-4"
                >
                  <X size={22} className="stroke-[1.2]" />
                </button>
                <h2 className="text-xs uppercase tracking-[0.15em] font-medium text-primary">MY ACCOUNT</h2>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-white px-5 md:px-8 py-8 md:py-10">
                {/* Content Container (Tabs + Form) */}
                <div className="flex flex-col w-full max-w-[340px] mx-auto mt-6">
                  
                  {/* Tabs */}
                  <div className="flex w-full border-b border-[#EAEAEA] mb-12">
                    <button
                      onClick={() => setActiveTab('signIn')}
                      className={`flex-1 pb-4 text-[10px] md:text-[11px] text-center uppercase tracking-[0.15em] transition-colors relative ${
                        activeTab === 'signIn' ? 'text-primary font-medium' : 'text-[#888] hover:text-primary'
                      }`}
                    >
                      SIGN IN
                      {activeTab === 'signIn' && (
                        <span className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-[#C1A87D]" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('createAccount')}
                      className={`flex-1 pb-4 text-[10px] md:text-[11px] text-center uppercase tracking-[0.15em] transition-colors relative ${
                        activeTab === 'createAccount' ? 'text-primary font-medium' : 'text-[#888] hover:text-primary'
                      }`}
                    >
                      CREATE ACCOUNT
                      {activeTab === 'createAccount' && (
                        <span className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-[#C1A87D]" />
                      )}
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex flex-col space-y-6 w-full">
                    <AnimatePresence mode="wait">
                      {activeTab === 'signIn' ? (
                        <motion.div
                          key="signIn"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col"
                        >
                          <div className="mb-8">
                            <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">YOUR EMAIL *</label>
                            <input type="email" className="w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors" />
                          </div>
                          <div className="mb-12">
                            <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">PASSWORD *</label>
                            <input type="password" className="w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors" />
                          </div>
                          <button className="w-full bg-black text-white py-3.5 text-[11px] uppercase tracking-[0.2em] hover:bg-secondary transition-colors duration-300 font-medium">
                            SIGN IN
                          </button>
                          <div className="mt-5 text-center">
                            <Link href="#" className="font-serif text-[14px] text-primary underline decoration-1 underline-offset-4 hover:text-secondary">
                              Forgot Password?
                            </Link>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="createAccount"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col"
                        >
                          <div className="mb-8">
                            <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">FIRST NAME *</label>
                            <input type="text" className="w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors" />
                          </div>
                          <div className="mb-8">
                            <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">LAST NAME *</label>
                            <input type="text" className="w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors" />
                          </div>
                          <div className="mb-8">
                            <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">EMAIL ADDRESS *</label>
                            <input type="email" className="w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors" />
                          </div>
                          <div className="mb-10">
                            <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">PASSWORD *</label>
                            <input type="password" className="w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors" />
                          </div>
                          
                          <p className="font-serif text-[13px] text-primary mb-8 text-center leading-relaxed">
                            By signing up, you agree to our <Link href="#" className="underline decoration-1 underline-offset-4">Terms of Use and Privacy Policy</Link>.
                          </p>

                          <button className="w-full bg-black text-white py-3.5 text-[11px] uppercase tracking-[0.2em] hover:bg-secondary transition-colors duration-300 font-medium">
                            CREATE ACCOUNT
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
