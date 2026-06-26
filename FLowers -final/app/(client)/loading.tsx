'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center font-sans">
      <div className="space-y-4 text-center">
        {/* Animated Gold Spinner */}
        <div className="w-10 h-10 border-2 border-secondary/20 border-t-gold rounded-full animate-spin mx-auto" />
        <span className="font-serif text-lg tracking-[0.2em] uppercase font-bold text-primary animate-pulse block pt-2">
          Lebami
        </span>
        <p className="text-[10px] text-muted uppercase tracking-widest">
          Loading Luxury Preserved Florals...
        </p>
      </div>
    </div>
  );
}
