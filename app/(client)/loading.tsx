'use client';

import React from 'react';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center animate-in fade-in duration-1000">
        
        {/* Center Logo wrapped in Elegant Rings */}
        <div className="relative flex items-center justify-center w-32 h-32 mb-12">
          {/* Slow Spinning Gold Outer Ring */}
          <div className="absolute inset-0 rounded-full border-[1px] border-[#D4A843]/20 border-t-[#D4A843]/80 animate-[spin_3s_linear_infinite]" />
          {/* Extremely Subtle Inner Reverse Ring */}
          <div className="absolute inset-2 rounded-full border-[1px] border-gray-100 border-b-gray-300 animate-[spin_4s_linear_infinite_reverse]" />
          
          {/* Gently Pulsing Central Logo */}
          <div className="relative w-20 h-20 flex items-center justify-center animate-[pulse_3s_ease-in-out_infinite]">
            <Image
              src="/images/lebami.png"
              alt="Lebami Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        {/* High-End Typography */}
        <div className="flex flex-col items-center gap-4">
          <p className="font-sans text-[9px] text-gray-900 uppercase tracking-[0.4em] font-medium animate-[pulse_4s_ease-in-out_infinite]">
            Curating Luxury
          </p>
          <div className="w-8 h-[1px] bg-[#D4A843]/60" />
        </div>
        
      </div>
    </div>
  );
}
