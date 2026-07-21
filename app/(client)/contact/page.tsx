'use client';

import React, { useState } from 'react';
import { ChevronRight, PackageSearch, Paperclip } from 'lucide-react';
import Breadcrumbs from '../../../components/Breadcrumbs';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && subject && message) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }
  };

  const quickLinks = [
    'Where\'s My Order?',
    'Modify Shipping Address',
    'Cancel My Order',
    'Report Damages',
    'Shipping Cutoff Times',
    'Returns and Exchanges'
  ];

  return (
    <div className="max-w-[800px] mx-auto px-4 md:px-8 py-12 md:py-16 text-secondary min-h-screen">
      {/* Breadcrumbs */}
      <div className="mb-10 font-sans">
        <Breadcrumbs items={[{ label: 'Contact us', href: '/contact' }]} />
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {quickLinks.map((link, idx) => (
          <button 
            key={idx} 
            className="flex items-center justify-between border border-secondary/20 p-5 rounded-sm hover:border-secondary transition-colors bg-white/50"
          >
            <span className="font-serif font-medium text-[15px]">{link}</span>
            <ChevronRight size={18} className="text-secondary/40" />
          </button>
        ))}
      </div>

      {/* Track Order Section */}
      <div className="border border-secondary/20 p-6 md:p-8 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors mb-12 bg-white/50">
        <PackageSearch size={32} strokeWidth={1.2} className="mb-3 text-secondary" />
        <span className="font-serif font-medium text-[15px]">Track order</span>
      </div>

      {/* Contact Form Section */}
      <div className="border border-secondary/20 rounded-sm p-6 md:p-10 bg-white/50">
        <h1 className="text-3xl md:text-4xl font-serif mb-8 border-b border-secondary/20 pb-6">Contact us</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 font-sans">
          
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-secondary">
              Full name <span className="text-red-400">*</span>
            </label>
            <input 
              type="text"
              required
              value={name}
              autoComplete="name" onChange={(e) => setName(e.target.value)}
              className="border border-secondary/20 p-3 md:p-4 rounded-sm focus:outline-none focus:border-secondary transition-colors bg-transparent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-secondary">
              Email <span className="text-red-400">*</span>
            </label>
            <input 
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              autoComplete="email" inputMode="email" onChange={(e) => setEmail(e.target.value)}
              className="border border-secondary/20 p-3 md:p-4 rounded-sm focus:outline-none focus:border-secondary transition-colors placeholder:text-secondary/30 bg-transparent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-secondary">
              Subject <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-secondary/20 p-3 md:p-4 rounded-sm focus:outline-none focus:border-secondary transition-colors appearance-none bg-transparent"
              >
                <option value="" disabled>Select a subject</option>
                <option value="order_issue">Order Issue</option>
                <option value="product_question">Product Question</option>
                <option value="returns">Returns</option>
                <option value="other">Other</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <ChevronRight size={16} className="text-secondary/50 transform rotate-90" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-secondary">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border border-secondary/20 p-3 md:p-4 rounded-sm focus:outline-none focus:border-secondary transition-colors resize-y bg-transparent"
            ></textarea>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <button type="button" className="flex items-center justify-center gap-2 w-full py-4 bg-[#F9F9F9] border border-secondary/10 hover:bg-[#EFEFEF] transition-colors rounded-sm text-[13px] font-serif font-medium text-secondary">
              <Paperclip size={18} /> Attach Files
            </button>
            <p className="text-[11px] text-secondary/50">Attach up to 10 files. The maximum allowed size per file is 10 MB.</p>
          </div>

          <button 
            type="submit"
            className="w-full bg-black text-white font-sans text-[11px] uppercase tracking-[0.2em] py-5 mt-4 hover:bg-black/80 transition-colors rounded-sm font-medium"
          >
            {submitted ? 'SENT SUCCESSFULLY' : 'SEND'}
          </button>
          
          <p className="text-[11px] text-secondary/60 text-left mt-2">
            This site is protected by reCAPTCHA. For more information, please refer to Gorgias' <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
