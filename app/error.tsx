'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error details to telemetry console
    console.error('Atelier Runtime Exception:', error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center font-sans text-primary space-y-6">
      <div className="flex justify-center text-secondary">
        <AlertTriangle size={48} className="stroke-[1.5]" />
      </div>
      <span className="text-[10px] uppercase tracking-[0.25em] text-secondary font-semibold block">
        Concierge Notice
      </span>
      <h1 className="font-serif text-3xl font-medium tracking-wide">
        System Interruption
      </h1>
      <p className="text-muted text-xs md:text-sm leading-relaxed">
        We encountered an unexpected error while loading this page. Our engineers have been alerted.
      </p>
      
      <div className="flex justify-center gap-4 pt-4">
        <button
          onClick={() => reset()}
          className="flex items-center space-x-2 bg-primary hover:bg-secondary text-white px-6 py-3 text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-sm"
        >
          <RefreshCw size={12} />
          <span>Reload Page</span>
        </button>
        <Link
          href="/"
          className="px-6 py-3 border border-divider hover:border-primary text-xs uppercase tracking-widest font-semibold text-muted hover:text-primary transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
