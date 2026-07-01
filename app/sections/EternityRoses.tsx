'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function EternityRoses() {
  return (
    <section className="py-16 md:py-24 px-6 md:px-12 overflow-hidden">
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        {/* Left Side - Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center text-center lg:items-start lg:text-left order-2 lg:order-1"
        >
          <h2 className="font-serif text-[48px] font-light text-secondary leading-[1.2]">
            ETERNITY ROSES
          </h2>
          
          <p className="font-sans text-[16px] text-muted leading-[1.6] mt-6 mb-10 max-w-[480px]">
            The original roses that started it all. Handcrafted luxury arrangements of real roses that last a year or more.
          </p>
          
          <Link
            href="/shop"
            className="btn-primary inline-block px-8 py-4 text-[15px] uppercase tracking-[0.15em]"
          >
            SHOP THE COLLECTION
          </Link>
        </motion.div>

        {/* Right Side - Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative aspect-[4/5] w-full order-1 lg:order-2"
        >
          <Image
            src="/images/category_gift_boxes_1782290153364.png"
            alt="Eternity Roses Collection"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </motion.div>
      </div>
    </section>
  )
}
