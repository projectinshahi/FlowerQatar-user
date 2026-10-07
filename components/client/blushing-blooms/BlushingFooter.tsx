'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { linkColumns } from '@/app/sections/Footer';
import { BB_ASSETS } from '@/data/blushing-blooms';

/**
 * Dark footer for the Blushing Blooms page.
 *
 * The destinations come from app/sections/Footer.tsx rather than a second hard-coded list, so
 * adding or renaming a footer link updates both footers at once. Only the surface differs:
 * black ground, the Blushing Blooms wordmark, and the filled newsletter pill from the design.
 *
 * The two blurred ellipses in the design are reproduced as CSS radial gradients rather than
 * exported SVGs — a blurred ellipse is a gradient, and this keeps two large decorative assets
 * out of the bundle while rendering identically.
 */
export default function BlushingFooter() {
  return (
    <footer className="relative isolate overflow-hidden bg-black px-6 py-14 text-white sm:px-10 lg:px-[179px] lg:py-[60px]">
      {/* Decorative warm glows (design: Ellipse 5 / Ellipse 6) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/2 left-[-40%] -z-10 h-[680px] w-[1378px] max-w-none opacity-70"
        style={{ background: 'radial-gradient(closest-side, rgba(204,150,90,0.30), transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-60%] right-[-30%] -z-10 h-[680px] w-[1378px] max-w-none opacity-60"
        style={{ background: 'radial-gradient(closest-side, rgba(224,91,162,0.18), transparent 70%)' }}
      />

      <div className="mx-auto flex max-w-[1082px] flex-col items-center gap-14 lg:gap-[76px]">
        {/* Wordmark + newsletter */}
        <div className="flex w-full max-w-[490px] flex-col items-center gap-8 lg:gap-10">
          <div className="relative h-[86px] w-[122px] sm:h-[115px] sm:w-[162px]">
            <Image src={BB_ASSETS.logo} alt="Blushing Blooms" fill sizes="162px" className="object-contain" />
          </div>

          <div className="flex w-full flex-col items-center gap-6 lg:gap-7">
            <h2 className="text-center text-[19px] tracking-[0.02em] text-white sm:text-[24px]">STAY IN TOUCH</h2>

            {/*
              Presentational only, exactly like the shared footer's field: there is no newsletter
              endpoint in this project, so submitting is prevented rather than silently dropping
              the address and implying a subscription that never happened.
            */}
            <form
              suppressHydrationWarning
              onSubmit={(e) => e.preventDefault()}
              className="flex w-full items-center justify-between gap-3 rounded-[46px] bg-[#efc6a9] py-1.5 pl-5 pr-1.5"
            >
              <label htmlFor="bb-newsletter" className="sr-only">
                Email address
              </label>
              <input
                suppressHydrationWarning
                id="bb-newsletter"
                type="email"
                placeholder="EMAIL ADDRESS"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-black placeholder:text-black/30 focus:outline-none sm:text-[16px]"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                suppressHydrationWarning
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-black transition-transform duration-300 hover:translate-x-0.5 sm:h-10 sm:w-10"
              >
                <ArrowRight size={22} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>

        {/* Link columns — shared with app/sections/Footer.tsx */}
        <div className="grid w-full grid-cols-2 gap-x-8 gap-y-10 text-center sm:grid-cols-3 lg:gap-x-[160px]">
          {linkColumns.map((col) => (
            <div key={col.title} className="flex flex-col items-center gap-5 lg:gap-6">
              <h3 className="text-[15px] font-medium tracking-[0.02em] text-white sm:text-[20px]">{col.title}</h3>
              <ul className="flex flex-col items-center gap-3 lg:gap-4">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] capitalize text-white/50 transition-colors hover:text-white sm:text-[16px]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">© 2026 Lebami | All rights reserved</p>
      </div>
    </footer>
  );
}
