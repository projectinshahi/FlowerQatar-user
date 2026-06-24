'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import Breadcrumbs from '../../../components/Breadcrumbs';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Fields State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    
    if (tab === 'register' && (!firstName || !lastName)) {
      setError('First and last names are required.');
      return;
    }

    setLoading(true);
    
    // Simulate API authorization
    setTimeout(() => {
      setLoading(false);
      // Mock session storage auth flag
      localStorage.setItem('v_user_authenticated', 'true');
      localStorage.setItem('v_user_email', email);
      localStorage.setItem('v_user_name', tab === 'register' ? `${firstName} ${lastName}` : 'Savannah Sterling');
      router.push('/account');
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Account Login', href: '/account/login' }]} />

      <div className="flex justify-center items-center py-12">
        <div className="w-full max-w-md bg-white border border-divider shadow-xl p-8 relative rounded-none">
          {/* Top gold line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-secondary" />

          {/* Title tabs */}
          <div className="flex border-b border-divider mb-8">
            <button
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={`flex-1 pb-3 text-xs uppercase tracking-widest font-semibold transition-colors duration-300 rounded-none ${
                tab === 'login' ? 'text-secondary border-b-2 border-secondary font-bold' : 'text-muted/50 hover:text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('register');
                setError('');
              }}
              className={`flex-1 pb-3 text-xs uppercase tracking-widest font-semibold transition-colors duration-300 rounded-none ${
                tab === 'register' ? 'text-secondary border-b-2 border-secondary font-bold' : 'text-muted/50 hover:text-primary'
              }`}
            >
              Register Account
            </button>
          </div>

          <span className="text-[9px] uppercase tracking-[0.25em] text-secondary font-semibold text-center block mb-4">
            Welcome to the Atelier
          </span>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 p-3 mb-6 text-center leading-relaxed">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-muted block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-muted block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[9px] uppercase tracking-wider font-semibold text-muted block mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@domain.com"
                  className="w-full pl-9 pr-3 py-2 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted/40">
                  <Mail size={13} />
                </span>
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider font-semibold text-muted block mb-1">
                Secret Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs rounded-none"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted/40">
                  <KeyRound size={13} />
                </span>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-secondary text-white text-xs uppercase tracking-[0.2em] font-semibold transition-colors duration-500 rounded-none shadow-md flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Processing...' : tab === 'login' ? 'Log In' : 'Create Account'}</span>
              </button>
            </div>
          </form>

          {tab === 'login' && (
            <div className="text-center mt-6">
              <button
                onClick={() => setError('Password reset instructions sent to your email.')}
                className="text-[10px] text-muted/60 hover:text-secondary uppercase tracking-widest hover:underline transition-colors"
              >
                Forgot secret password?
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-divider text-center text-[10px] text-muted/60 flex items-center justify-center space-x-2">
            <Sparkles size={12} className="text-secondary" />
            <span>Preserved real Ecuadorian roses shipped worldwide</span>
          </div>

        </div>
      </div>
    </div>
  );
}
