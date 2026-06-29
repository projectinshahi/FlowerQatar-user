'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Link from 'next/link';

const GoogleButton = () => (
  <div className="mt-6 pt-6 border-t border-[#EAEAEA]">
    <a
      href="/api/auth/google"
      className="w-full flex items-center justify-center space-x-3 border border-black py-3 hover:bg-black hover:text-white transition-colors duration-300 text-[11px] uppercase tracking-[0.15em] font-medium"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      <span>Continue with Google</span>
    </a>
  </div>
);

export default function AccountDrawer() {
  const { isAccountOpen, setAccountOpen, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'signIn' | 'createAccount' | 'otp'>('signIn');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!firstName || !lastName || !email || !password) {
      return setError('Please fill in all fields.');
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSuccessMsg(data.message);
      addToast('Account created! Please verify your email.', 'success');
      setActiveTab('otp');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email || !password) {
      return setError('Please enter your email and password.');
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, isAdminLogin: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.unverified) {
           setActiveTab('otp');
           setSuccessMsg('Please verify your email to login.');
           return;
        }
        throw new Error(data.error || 'Login failed');
      }
      // Redirect to home page
      addToast('Successfully logged in!', 'success');
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!otp) return setError('Please enter the OTP.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      setSuccessMsg('Email verified successfully! You can now log in.');
      addToast('Email verified successfully!', 'success');
      setActiveTab('signIn');
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

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
                  {activeTab !== 'otp' ? (
                    <div className="flex w-full border-b border-[#EAEAEA] mb-12">
                      <button
                        onClick={() => { setActiveTab('signIn'); setError(''); setSuccessMsg(''); }}
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
                        onClick={() => { setActiveTab('createAccount'); setError(''); setSuccessMsg(''); }}
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
                  ) : (
                    <div className="flex w-full border-b border-[#EAEAEA] mb-12 justify-center">
                      <span className="pb-4 text-[11px] text-center uppercase tracking-[0.15em] text-primary font-medium relative">
                        VERIFY EMAIL
                        <span className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-[#C1A87D]" />
                      </span>
                    </div>
                  )}

                  {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-500 text-xs text-center">
                      {error}
                    </div>
                  )}

                  {successMsg && (
                    <div className="mb-6 p-3 bg-green-50 border border-green-100 text-green-600 text-xs text-center flex items-center justify-center gap-2">
                      <CheckCircle2 size={14} />
                      {successMsg}
                    </div>
                  )}

                  {/* Tab Content */}
                  <div className="flex flex-col space-y-6 w-full">
                    <AnimatePresence mode="wait">
                      {activeTab === 'signIn' && (
                        <motion.div
                          key="signIn"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col"
                        >
                          <form onSubmit={handleLogin}>
                            <div className="mb-8">
                              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">YOUR EMAIL *</label>
                              <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors" 
                              />
                            </div>
                            <div className="mb-12">
                              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">PASSWORD *</label>
                              <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors" 
                              />
                            </div>
                            <button 
                              type="submit"
                              disabled={loading}
                              className="w-full bg-black text-white py-3.5 text-[11px] uppercase tracking-[0.2em] hover:bg-secondary transition-colors duration-300 font-medium disabled:bg-gray-400"
                            >
                              {loading ? 'PROCESSING...' : 'SIGN IN'}
                            </button>
                            <div className="mt-5 text-center">
                              <Link href="#" className="font-serif text-[14px] text-primary underline decoration-1 underline-offset-4 hover:text-secondary">
                                Forgot Password?
                              </Link>
                            </div>
                          </form>
                          <GoogleButton />
                        </motion.div>
                      )}

                      {activeTab === 'createAccount' && (
                        <motion.div
                          key="createAccount"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col"
                        >
                          <form onSubmit={handleRegister}>
                            <div className="mb-8">
                              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">FIRST NAME *</label>
                              <input 
                                type="text" 
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors" 
                              />
                            </div>
                            <div className="mb-8">
                              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">LAST NAME *</label>
                              <input 
                                type="text" 
                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors" 
                              />
                            </div>
                            <div className="mb-8">
                              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">EMAIL ADDRESS *</label>
                              <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors" 
                              />
                            </div>
                            <div className="mb-10">
                              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">PASSWORD *</label>
                              <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors" 
                              />
                            </div>
                            
                            <p className="font-serif text-[13px] text-primary mb-8 text-center leading-relaxed">
                              By signing up, you agree to our <Link href="#" className="underline decoration-1 underline-offset-4">Terms of Use and Privacy Policy</Link>.
                            </p>
  
                            <button 
                              type="submit"
                              disabled={loading}
                              className="w-full bg-black text-white py-3.5 text-[11px] uppercase tracking-[0.2em] hover:bg-secondary transition-colors duration-300 font-medium disabled:bg-gray-400"
                            >
                              {loading ? 'PROCESSING...' : 'CREATE ACCOUNT'}
                            </button>
                          </form>
                          <GoogleButton />
                        </motion.div>
                      )}

                      {activeTab === 'otp' && (
                        <motion.div
                          key="otp"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col"
                        >
                          <form onSubmit={handleVerifyOtp}>
                            <div className="mb-10">
                              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1">6-DIGIT CODE *</label>
                              <input 
                                type="text" 
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full border-0 border-b border-black text-sm py-2 px-0 text-center tracking-[0.5em] focus:ring-0 focus:border-black outline-none bg-transparent transition-colors font-bold" 
                                placeholder="Enter code"
                              />
                              <p className="text-[10px] text-[#888] mt-3 text-center">Check the server console for the code.</p>
                            </div>
                            <button 
                              type="submit"
                              disabled={loading}
                              className="w-full bg-black text-white py-3.5 text-[11px] uppercase tracking-[0.2em] hover:bg-secondary transition-colors duration-300 font-medium disabled:bg-gray-400"
                            >
                              {loading ? 'PROCESSING...' : 'VERIFY EMAIL'}
                            </button>
                          </form>
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
