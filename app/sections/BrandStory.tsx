'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function BrandStory() {
  const containerRef = useRef<HTMLElement>(null)

  /*
   * Parallax that never uncovers the maroon while the section is fully on screen. The photo slides
   * only while part of the section is off screen: up as it enters, down as it leaves. The slide is
   * never larger than the off-screen part, so the strip it uncovers is always off screen too.
   */
  const { scrollYProgress: entering } = useScroll({ target: containerRef, offset: ['start end', 'end end'] })
  const { scrollYProgress: leaving } = useScroll({ target: containerRef, offset: ['start start', 'end start'] })
  const y = useTransform([entering, leaving], ([e, l]: number[]) => `${(l - (1 - e)) * 40}%`)

  return (
    /*
     * Below lg: the photo's shape, with minimum heights that keep the copy inside it (the photo's
     * sides are trimmed there instead of its top and bottom).
     * lg and up: never taller than the screen under the fixed menu bar (--site-header-h). The photo
     * always spans the full width; when that cap bites, its top and bottom are trimmed instead.
     *
     * w-full is load-bearing, not decoration. `aspect-ratio` together with `min-height` transfers a
     * MINIMUM WIDTH through the ratio: min-h-120 (480px) x 1672/941 made this section 853px wide on
     * every phone, whatever the viewport. body{overflow-x:hidden} in globals.css hid that on Chrome
     * and Android, but iOS Safari does not contain it at body level, so the document itself became
     * 853px wide - every other section then laid out at ~390px against a 853px page, leaving the
     * blank strip on the right that could be scrolled into. An explicit width makes the width
     * definite, so the ratio can only resolve the height and min-height clamps that height alone.
     */
    <section
      ref={containerRef}
      className="relative w-full aspect-1672/941 min-h-120 md:min-h-140 lg:aspect-auto lg:min-h-110 lg:h-[min(56.28vw,calc(100svh_-_var(--site-header-h,155px)))] overflow-hidden bg-secondary"
    >
      {/* Parallax Background */}
      <motion.div style={{ y }} className="absolute inset-0">
        <Image
          src="/images/2.jpg"
          alt="Lebami florist wrapping a rose bouquet"
          fill
          sizes="100vw"
          className="object-cover object-left"
        />
        <div className="absolute inset-0 bg-primary/70 mix-blend-multiply" />
      </motion.div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center px-6 md:px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center max-w-3xl"
        >
          {/* Inline colour: globals.css paints every heading brand red, which beats text-white. */}
          <h2
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            className="font-sans text-[11px] uppercase tracking-[0.2em] text-center"
          >
            WHO WE ARE
          </h2>
          
          {/*
            Fluid below md so the four phrases stop stacking into a tall column of short ragged
            lines on a 320-375px phone: 20px at 320px up to the original 28px by ~470px, where it
            meets the unchanged md size. text-balance evens the line lengths out, which is what
            stops a single trailing word on its own line.
          */}
          <p className="font-serif text-[clamp(1.25rem,6vw,1.75rem)] md:text-[48px] text-white font-light text-center text-balance tracking-[-0.01em] leading-[1.35] mt-5 md:mt-6 md:tracking-normal md:leading-[1.3]">
            PIONEERS OF ETERNITY FLOWERS <br className="hidden md:block" />
            <span className="md:hidden">/ </span>
            LUXURY THAT LASTS ALL YEAR <br className="hidden md:block" />
            <span className="md:hidden">/ </span>
            CRAFTSMANSHIP IN EVERY PETAL <br className="hidden md:block" />
            <span className="md:hidden">/ </span>
            EXCLUSIVELY MADE TO ORDER
          </p>
          
          <Link
            href="/about"
            className="border border-white text-white px-8 py-4 font-sans text-[15px] uppercase tracking-[0.15em] hover:bg-white hover:text-[#2a0015] transition-colors duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] mt-8 md:mt-10 inline-block"
          >
            LEARN MORE
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
