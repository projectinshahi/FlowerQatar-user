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

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-4 text-xs tracking-widest uppercase">
      <ol className="flex flex-wrap items-center space-x-2 text-muted">
        <li>
          <Link href="/" className="hover:text-secondary transition-colors duration-300">
            Home
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <li className="text-secondary font-light select-none">/</li>
              <li className={isLast ? 'text-primary font-medium' : ''}>
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
