'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function EternityRoses() {
  return (
    <section className="py-24 px-4 md:px-12 lg:px-20 overflow-hidden">
      <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left Side - Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-start order-2 md:order-1"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-light text-secondary">
            ETERNITY ROSES
          </h2>
          
          <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted mt-6 max-w-[400px] leading-relaxed">
            THE ROSES THAT STARTED IT ALL.
          </p>
          
          <Link
            href="#"
            className="btn-primary inline-block px-8 py-4"
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
          className="relative aspect-[4/5] w-full order-1 md:order-2"
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
