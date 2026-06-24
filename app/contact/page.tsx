'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import Breadcrumbs from '../../components/Breadcrumbs';

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
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 4000);
    }
  };

  const BOUTIQUES = [
    {
      city: 'New York Flagship',
      address: '143 Golden Plaza, Soho, NY 10012',
      phone: '+1 (212) 555-0199',
      hours: 'Mon - Sat: 10:00 AM - 7:00 PM • Sun: 11:00 AM - 6:00 PM',
    },
    {
      city: 'London Mayfair',
      address: '42 New Bond St, London W1S 2RY',
      phone: '+44 20 7946 0958',
      hours: 'Mon - Sat: 10:00 AM - 6:00 PM • Sun: Closed',
    },
    {
      city: 'Los Angeles Boutique',
      address: '8500 Beverly Blvd, Los Angeles, CA 90048',
      phone: '+1 (310) 555-0144',
      hours: 'Mon - Sat: 10:00 AM - 8:00 PM • Sun: 11:00 AM - 6:00 PM',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Contact Us', href: '/contact' }]} />

      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-16 mt-4">
        <span className="text-xs uppercase tracking-[0.25em] text-secondary font-light block mb-2">
          Concierge Support
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-medium tracking-wide">
          Contact the Atelier
        </h1>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          For custom bulk corporate orders, wedding consultation requests, or delivery tracking support, reach out to our concierge team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Ateliers Locations (Col: 5) */}
        <div className="lg:col-span-5 space-y-8">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-2">
              Physical Boutiques
            </span>
            <h2 className="font-serif text-2xl text-primary">
              Visit Our Locations
            </h2>
          </div>

          <div className="space-y-6">
            {BOUTIQUES.map((boutique, idx) => (
              <div key={idx} className="bg-cream/40 border border-divider p-6 rounded-none space-y-3">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-primary flex items-center gap-1.5">
                  <MapPin size={14} className="text-secondary" />
                  <span>{boutique.city}</span>
                </h3>
                <div className="text-xs text-muted space-y-1">
                  <p>{boutique.address}</p>
                  <p className="font-semibold text-primary">{boutique.phone}</p>
                  <p className="text-[10px] text-muted/60 italic pt-1">{boutique.hours}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Contact form (Col: 7) */}
        <div className="lg:col-span-7">
          <div className="border border-divider p-8 bg-white shadow-xs">
            <div className="flex flex-col mb-6">
              <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-2">
                Digital Inquiry
              </span>
              <h2 className="font-serif text-2xl text-primary">
                Send a Message
              </h2>
            </div>

            {submitted ? (
              <div className="py-12 text-center text-secondary space-y-3 animate-in fade-in duration-300">
                <div className="flex justify-center"><CheckCircle2 size={40} className="stroke-[1.5]" /></div>
                <h3 className="text-sm uppercase tracking-wider font-bold">Message Transmitted</h3>
                <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
                  Thank you. A customer concierge will review your message and reply within 12 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase tracking-wider font-semibold text-muted block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs text-primary rounded-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-wider font-semibold text-muted block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs text-primary rounded-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-muted block mb-1">
                    Subject Heading
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs text-primary rounded-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-muted block mb-1">
                    Inquiry Message
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 bg-cream/30 border border-divider focus:border-secondary focus:outline-none text-xs text-primary leading-relaxed rounded-none"
                    placeholder="Enter details..."
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary hover:bg-secondary text-white uppercase text-xs tracking-widest font-semibold transition-colors duration-500 rounded-none shadow-md flex items-center space-x-2"
                  >
                    <Send size={12} />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
