'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatedSection } from '../../components/AnimatedSection'

const categories = [
  { name: "FLOWERS", image: "/images/product_master_1_1782290164345.png" },
  { name: "LUXURY BOUQUETS", image: "/images/category_bouquets_1782290106325.png" },
  { name: "CHOCOLATE GIFTS", image: "/images/category_chocolates_1782290122821.png" },
  { name: "GIFT BOXES", image: "/images/category_gift_boxes_1782290153364.png" }
]

const container: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
}

const item: any = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

export default function ExploreGardens() {
  return (
    <AnimatedSection className="py-20">
      <h2 className="font-serif text-4xl font-light text-secondary text-center mb-12">
        EXPLORE OUR GARDENS
      </h2>
      
      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-2 md:grid-cols-4 gap-0"
      >
        {categories.map((category, idx) => (
          <motion.div key={idx} variants={item}>
            <Link href="#" className="block relative aspect-[4/5] overflow-hidden group cursor-pointer">
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-600 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-transparent group-hover:bg-primary transition-colors duration-400" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                <span className="block font-serif text-2xl text-white tracking-wide drop-shadow-lg text-center px-4">
                  {category.name}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </AnimatedSection>
  )
}
