'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function MatiMarine() {
  return (
    <section className="bg-[#FFF8F5] py-24 md:py-32 px-4 md:px-12 lg:px-20 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        
        {/* Left Side - Editorial Images */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full lg:w-1/2 flex justify-center lg:justify-start"
        >
          <div className="relative w-[85%] sm:w-[70%] lg:w-full max-w-[480px] mb-8 lg:mb-0">
            {/* Main Large Image */}
            <div className="relative aspect-[4/5] w-full bg-white p-2 lg:p-3 shadow-lg">
              <div className="relative w-full h-full">
                <Image
                  src="/images/product_master_1_1782290164345.png"
                  alt="Mati Marine Collection"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Overlapping Small Image (Now on all devices) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute -bottom-8 -right-4 lg:-bottom-12 lg:-right-12 w-[60%] lg:w-72 aspect-square z-10 p-2 lg:p-3 bg-white shadow-xl"
            >
              <div className="relative w-full h-full">
                <Image
                  src="/images/category_bouquets_1782290106325.png"
                  alt="Mati Marine Detail"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Typography & Content */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left z-20"
        >
          <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary mb-4 block font-semibold">
            THE SIGNATURE COLLECTION
          </span>
          
          <h2 className="font-serif text-5xl lg:text-6xl font-light text-primary mb-8 leading-tight">
            MATI MARINE
          </h2>
          
          <div className="w-16 h-px bg-secondary/30 mx-auto lg:mx-0 mb-8" />
          
          <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-primary/80 leading-loose max-w-[400px] mx-auto lg:mx-0 mb-6">
            PROTECTIVE EVIL EYE COLLECTION.<br/>
            HANDCRAFTED IN PARIS.
          </p>
          
          <p className="font-sans text-sm text-muted leading-relaxed max-w-[480px] mx-auto lg:mx-0 mb-10">
            Discover the timeless elegance of our exclusive Mati Marine collection. Each piece is thoughtfully curated to bring an essence of Parisian luxury and protective energy into your home. Experience the perfect harmony of vivid floral tones and meaningful design.
          </p>
          
          <Link
            href="#"
            className="btn-primary inline-block px-10 py-4 w-fit mx-auto lg:mx-0 text-[11px] tracking-[0.2em]"
          >
            DISCOVER THE COLLECTION
          </Link>
        </motion.div>


      </div>
    </section>
  )
}