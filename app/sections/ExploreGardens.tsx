'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatedSection } from '../../components/AnimatedSection'

interface CategoryItem {
  name: string;
  image: string;
  hoverColor: string;
  textColor: string;
  slug: string;
}

const categories: CategoryItem[] = [
 // Classic Red
  { name: "RED ROSES", image: "/images/rosses.png", hoverColor: "rgba(180, 20, 30, 0.85)", textColor: "#000000", slug: "pink-roses" },
    { name: "PINK ROSES", image: "/images/red rosses.png", hoverColor: "rgba(244, 194, 194, 0.85)", textColor: "#FFFFFF", slug: "red-roses" }, // Blush Pink
  { name: "ORCHIDS", image: "/images/orchid.png", hoverColor: "rgba(255, 255, 255, 0.45)", textColor: "#FFFFFF", slug: "orchids" }, // Deep Purple
  { name: "LILIES", image: "/images/lillies.png", hoverColor: "rgba(244, 194, 194, 0.75)", textColor: "#000000", slug: "lilies" } // Pure White
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
    <AnimatedSection className="py-16 md:py-24">
      <div className="w-full">
        <h2 className="font-serif text-[48px] font-light text-secondary text-center mb-12 leading-[1.2] px-6">
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
              <Link href={`/shop?collection=${category.slug}`} className="block relative aspect-[4/5] overflow-hidden group cursor-pointer">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-600 group-hover:scale-105"
                />
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                  style={{ backgroundColor: category.hoverColor }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                  <span 
                    className="block font-serif text-[22px] tracking-wide drop-shadow-sm text-center px-4"
                    style={{ color: category.textColor }}
                  >
                    {category.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  )
}
