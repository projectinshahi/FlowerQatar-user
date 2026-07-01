'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatedSection } from '../../components/AnimatedSection'

export default function SignatureCollections() {
  return (
    <AnimatedSection className="py-16 md:py-32 px-6 md:px-12 bg-white overflow-hidden">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-12 lg:gap-24">
        
        {/* Left Column - Eternity Roses */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center md:items-start text-center md:text-left"
        >
          <div className="relative aspect-[4/5] w-full max-w-[600px] mb-8 md:mb-12 overflow-hidden group">
            <Image
              src="/images/category_gift_boxes_1782290153364.png"
              alt="Eternity Roses Collection"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          
          <h2 className="font-serif text-[48px] font-light text-primary leading-[1.2]">
            ETERNITY ROSES
          </h2>
          
          <p className="font-sans text-[16px] text-muted leading-[1.6] mt-4 mb-8 max-w-[480px]">
            The original roses that started it all. Handcrafted luxury arrangements of real roses that last a year or more.
          </p>
          
          <Link
            href="/shop"
            className="bg-primary text-white inline-block px-10 py-5 text-[12px] uppercase tracking-[0.2em] hover:bg-secondary transition-colors font-medium"
          >
            SHOP ETERNITY ROSES
          </Link>
        </motion.div>

        {/* Right Column - Mixed Florals */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center md:items-start text-center md:text-left mt-0 md:mt-[15vw] lg:mt-[150px]"
        >
          <div className="md:order-2 relative aspect-[4/5] w-full max-w-[600px] mt-8 md:mt-12 overflow-hidden group">
            <Image
              src="/images/product_master_1_1782290164345.png"
              alt="Mixed Florals Collection"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          <div className="md:order-1 flex flex-col items-center md:items-start w-full">
            <h2 className="font-serif text-[48px] font-light text-primary leading-[1.2]">
              MIXED FLORALS
            </h2>
            
            <p className="font-sans text-[16px] text-muted leading-[1.6] mt-4 mb-8 max-w-[480px]">
              Expertly designed blend of premium flowers. Hand-picked seasonal blooms arranged to perfection.
            </p>
            
            <Link
              href="/shop"
              className="bg-primary text-white inline-block px-10 py-5 text-[12px] uppercase tracking-[0.2em] hover:bg-secondary transition-colors font-medium"
            >
              SHOP MIXED FLORALS
            </Link>
          </div>
        </motion.div>

      </div>
    </AnimatedSection>
  )
}
