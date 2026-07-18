'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Link from 'next/link';
import OtpInput from './auth/OtpInput';
import PasswordField from './auth/PasswordField';

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

const inputCls =
  'w-full border-0 border-b border-black text-sm py-2 px-0 focus:ring-0 focus:border-black outline-none bg-transparent transition-colors';
const labelCls = 'block text-[10px] uppercase tracking-[0.15em] text-[#888] mb-1';
const primaryBtn =
  'w-full bg-black text-white py-3.5 text-[11px] uppercase tracking-[0.2em] hover:bg-secondary transition-colors duration-300 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed';

type RegStep = 'form' | 'otp' | 'password' | 'success';

export default function AccountDrawer() {
  const { isAccountOpen, setAccountOpen, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'signIn' | 'createAccount'>('signIn');

  // Sign-in
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Registration
  const [regStep, setRegStep] = useState<RegStep>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [regToken, setRegToken] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [resendSeconds, setResendSeconds] = useState(60);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Resend countdown while on the OTP step.
  useEffect(() => {
    if (regStep !== 'otp' || resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [regStep, resendSeconds]);

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const switchTab = (tab: 'signIn' | 'createAccount') => {
    setActiveTab(tab);
    clearMessages();
    if (tab === 'createAccount') setRegStep('form');
  };

  const resetRegistration = () => {
    setRegStep('form');
    setFirstName(''); setLastName(''); setRegEmail('');
    setOtpValue(''); setRegToken(''); setRegPassword(''); setRegConfirm('');
    setResendSeconds(60);
  };

  /* ─────────────── Sign in (unchanged behaviour) ─────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password) return setError('Please enter your email and password.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, isAdminLogin: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.unverified) return setError('Please verify your email before logging in.');
        throw new Error(data.error || 'Login failed');
      }
      addToast('Successfully logged in!', 'success');
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────── Registration: step 1 → send OTP ─────────────── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!firstName.trim() || !lastName.trim() || !regEmail.trim()) {
      return setError('Please fill in all fields.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      return setError('Please enter a valid email address.');
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email: regEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send verification code.');
      setOtpValue('');
      setResendSeconds(60);
      setRegStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────── Registration: step 2 → verify OTP ─────────────── */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (otpValue.length !== 6) return setError('Please enter the 6-digit code.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed.');
      setRegToken(data.token);
      setRegStep('password');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || loading) return;
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, firstName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not resend the code.');
      setOtpValue('');
      setResendSeconds(60);
      addToast('A new code has been sent.', 'success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────── Registration: step 3 → create account ─────────────── */
  const pwChecks = [
    { label: 'At least 8 characters', ok: regPassword.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(regPassword) },
    { label: 'One lowercase letter', ok: /[a-z]/.test(regPassword) },
    { label: 'One number', ok: /[0-9]/.test(regPassword) },
    { label: 'One special character', ok: /[^A-Za-z0-9]/.test(regPassword) },
  ];
  const pwValid = pwChecks.every((c) => c.ok);
  const pwMatch = regConfirm.length > 0 && regPassword === regConfirm;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!pwValid) return setError('Please meet all password requirements.');
    if (!pwMatch) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: regToken, firstName, lastName, password: regPassword, confirmPassword: regConfirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create your account.');
      setRegStep('success');
      addToast('Account created successfully!', 'success');
      setTimeout(() => {
        resetRegistration();
        setActiveTab('signIn');
        setEmail(regEmail);
        setSuccessMsg('Your account is ready. Please sign in.');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showTabs = activeTab === 'signIn' || (activeTab === 'createAccount' && regStep === 'form');
  const stepTitle =
    regStep === 'otp' ? 'VERIFY EMAIL' : regStep === 'password' ? 'CREATE PASSWORD' : regStep === 'success' ? 'WELCOME' : '';

  return (
    <AnimatePresence>
      {isAccountOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAccountOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col rounded-none"
            >
              {/* Header */}
              <div className="px-5 md:px-6 py-4 bg-[#F8F8F8] flex items-center justify-start border-b border-[#EAEAEA]">
                <button onClick={() => setAccountOpen(false)} className="text-primary hover:text-secondary transition-colors rounded-none mr-4">
                  <X size={22} className="stroke-[1.2]" />
                </button>
                <h2 className="text-xs uppercase tracking-[0.15em] font-medium text-primary">MY ACCOUNT</h2>
              </div>

              <div className="flex-1 overflow-y-auto bg-white px-5 md:px-8 py-8 md:py-10">
                <div className="flex flex-col w-full max-w-[340px] mx-auto mt-6">
                  {/* Tabs / step title */}
                  {showTabs ? (
                    <div className="flex w-full border-b border-[#EAEAEA] mb-12">
                      <button
                        onClick={() => switchTab('signIn')}
                        className={`flex-1 pb-4 text-[10px] md:text-[11px] text-center uppercase tracking-[0.15em] transition-colors relative ${activeTab === 'signIn' ? 'text-primary font-medium' : 'text-[#888] hover:text-primary'}`}
                      >
                        SIGN IN
                        {activeTab === 'signIn' && <span className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-[#C1A87D]" />}
                      </button>
                      <button
                        onClick={() => switchTab('createAccount')}
                        className={`flex-1 pb-4 text-[10px] md:text-[11px] text-center uppercase tracking-[0.15em] transition-colors relative ${activeTab === 'createAccount' ? 'text-primary font-medium' : 'text-[#888] hover:text-primary'}`}
                      >
                        CREATE ACCOUNT
                        {activeTab === 'createAccount' && <span className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-[#C1A87D]" />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex w-full border-b border-[#EAEAEA] mb-12 justify-center">
                      <span className="pb-4 text-[11px] text-center uppercase tracking-[0.15em] text-primary font-medium relative">
                        {stepTitle}
                        <span className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-[#C1A87D]" />
                      </span>
                    </div>
                  )}

                  {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-500 text-xs text-center" role="alert">
                      {error}
                    </div>
                  )}
                  {successMsg && (
                    <div className="mb-6 p-3 bg-green-50 border border-green-100 text-green-600 text-xs text-center flex items-center justify-center gap-2" role="status">
                      <CheckCircle2 size={14} />
                      {successMsg}
                    </div>
                  )}

                  <div className="flex flex-col space-y-6 w-full">
                    <AnimatePresence mode="wait">
                      {/* ───────── SIGN IN ───────── */}
                      {activeTab === 'signIn' && (
                        <motion.div key="signIn" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col">
                          <form onSubmit={handleLogin}>
                            <div className="mb-8">
                              <label className={labelCls}>YOUR EMAIL *</label>
                              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                            </div>
                            <div className="mb-12">
                              <label className={labelCls}>PASSWORD *</label>
                              <PasswordField value={password} onChange={setPassword} required autoComplete="current-password" />
                            </div>
                            <button type="submit" disabled={loading} className={primaryBtn}>{loading ? 'PROCESSING...' : 'SIGN IN'}</button>
                            <div className="mt-5 text-center">
                              <Link href="#" className="font-serif text-[14px] text-primary underline decoration-1 underline-offset-4 hover:text-secondary">Forgot Password?</Link>
                            </div>
                          </form>
                          <GoogleButton />
                        </motion.div>
                      )}

                      {/* ───────── REGISTER: form ───────── */}
                      {activeTab === 'createAccount' && regStep === 'form' && (
                        <motion.div key="reg-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col">
                          <form onSubmit={handleSendOtp}>
                            <div className="mb-8">
                              <label className={labelCls}>FIRST NAME *</label>
                              <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
                            </div>
                            <div className="mb-8">
                              <label className={labelCls}>LAST NAME *</label>
                              <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
                            </div>
                            <div className="mb-10">
                              <label className={labelCls}>EMAIL ADDRESS *</label>
                              <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className={inputCls} />
                            </div>
                            <p className="font-serif text-[13px] text-primary mb-8 text-center leading-relaxed">
                              By signing up, you agree to our <Link href="#" className="underline decoration-1 underline-offset-4">Terms of Use and Privacy Policy</Link>.
                            </p>
                            <button type="submit" disabled={loading} className={primaryBtn}>{loading ? 'SENDING CODE...' : 'CREATE ACCOUNT'}</button>
                          </form>
                          <GoogleButton />
                        </motion.div>
                      )}

                      {/* ───────── REGISTER: OTP ───────── */}
                      {activeTab === 'createAccount' && regStep === 'otp' && (
                        <motion.div key="reg-otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col">
                          <p className="text-[13px] text-center text-[#666] mb-2 font-serif">We have sent a verification code to</p>
                          <p className="text-[13px] text-center text-primary font-medium mb-8 break-all">{regEmail}</p>
                          <form onSubmit={handleVerify}>
                            <label className={`${labelCls} text-center mb-3`}>ENTER VERIFICATION CODE</label>
                            <div className="mb-8">
                              <OtpInput value={otpValue} onChange={setOtpValue} onComplete={setOtpValue} disabled={loading} />
                            </div>
                            <button type="submit" disabled={loading || otpValue.length !== 6} className={`${primaryBtn} mb-5`}>{loading ? 'VERIFYING...' : 'VERIFY'}</button>
                          </form>
                          <div className="text-center">
                            {resendSeconds > 0 ? (
                              <p className="text-[11px] text-[#888] uppercase tracking-[0.1em]">
                                Resend available in <span className="text-primary font-medium">00:{String(resendSeconds).padStart(2, '0')}</span>
                              </p>
                            ) : (
                              <button type="button" onClick={handleResend} disabled={loading} className="text-[12px] text-primary underline decoration-1 underline-offset-4 hover:text-secondary uppercase tracking-[0.1em]">
                                Resend OTP
                              </button>
                            )}
                          </div>
                          <button type="button" onClick={() => { setRegStep('form'); clearMessages(); }} className="mt-6 text-[11px] text-[#888] hover:text-primary text-center uppercase tracking-[0.1em]">
                            ← Change email
                          </button>
                        </motion.div>
                      )}

                      {/* ───────── REGISTER: password ───────── */}
                      {activeTab === 'createAccount' && regStep === 'password' && (
                        <motion.div key="reg-pw" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col">
                          <form onSubmit={handleCreateAccount}>
                            <div className="mb-6">
                              <label className={labelCls}>PASSWORD *</label>
                              <PasswordField value={regPassword} onChange={setRegPassword} required autoComplete="new-password" />
                            </div>
                            <ul className="mb-6 space-y-1.5">
                              {pwChecks.map((c) => (
                                <li key={c.label} className={`flex items-center gap-2 text-[11px] ${c.ok ? 'text-green-600' : 'text-[#999]'}`}>
                                  <Check size={12} className={c.ok ? 'opacity-100' : 'opacity-30'} />
                                  {c.label}
                                </li>
                              ))}
                            </ul>
                            <div className="mb-3">
                              <label className={labelCls}>CONFIRM PASSWORD *</label>
                              <PasswordField value={regConfirm} onChange={setRegConfirm} required autoComplete="new-password" />
                            </div>
                            {regConfirm.length > 0 && !pwMatch && (
                              <p className="text-[11px] text-red-500 mb-6">Passwords do not match.</p>
                            )}
                            <button type="submit" disabled={loading || !pwValid || !pwMatch} className={`${primaryBtn} mt-6`}>{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</button>
                          </form>
                        </motion.div>
                      )}

                      {/* ───────── REGISTER: success ───────── */}
                      {activeTab === 'createAccount' && regStep === 'success' && (
                        <motion.div key="reg-success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col items-center text-center py-6">
                          <CheckCircle2 size={44} className="text-green-500 mb-6" strokeWidth={1.2} />
                          <h3 className="font-serif text-[20px] text-primary mb-3">Account Created Successfully</h3>
                          <p className="text-[13px] text-[#666] leading-relaxed mb-1">Your email has been verified.</p>
                          <p className="text-[13px] text-[#666] leading-relaxed mb-6">Your account has been created successfully.</p>
                          <p className="text-[11px] text-[#999] uppercase tracking-[0.15em] animate-pulse">Redirecting to Login...</p>
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
