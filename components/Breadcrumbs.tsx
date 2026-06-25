'use client';

import React from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex flex-wrap items-center space-x-1.5 font-sans text-[13px] md:text-[14px] text-[#888]">
        <li>
          <Link href="/" className="hover:text-secondary transition-colors duration-300">
            Home
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <li className="text-[#888] flex items-center select-none opacity-60">
                <ChevronRight size={14} className="stroke-[1.5]" />
              </li>
              <li className={isLast ? 'text-primary' : ''}>
                {isLast || !item.href ? (
                  <span>{item.label}</span>
                ) : (
                  <Link href={item.href} className="hover:text-secondary transition-colors duration-300">
                    {item.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
