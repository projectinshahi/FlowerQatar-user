'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function MatiMarine() {
  return (
    <section className="bg-[#FFF6F0] py-24 px-4 md:px-12 lg:px-20 overflow-hidden">
      <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left Side - Large Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative aspect-[4/5] w-full"
        >
          <Image
            src="/images/product_master_1_1782290164345.png"
            alt="Mati Marine Collection"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </motion.div>

        {/* Right Side - Content & Small Image */}
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-12"
          >
            <h2 className="font-serif text-4xl md:text-5xl font-light text-primary">
              MATI MARINE
            </h2>
            <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted mt-6 max-w-[400px] leading-relaxed">
              PROTECTIVE EVIL EYE COLLECTION. HANDCRAFTED IN PARIS.
            </p>
            <Link
              href="#"
              className="btn-primary inline-block px-8 py-4 mt-8"
            >
              DISCOVER THE COLLECTION
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative aspect-square w-2/3 ml-auto"
          >
            <Image
              src="/images/category_bouquets_1782290106325.png"
              alt="Mati Marine Detail"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}