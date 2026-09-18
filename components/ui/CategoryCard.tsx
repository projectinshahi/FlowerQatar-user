import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  name: string;
  slug: string;
  image: string;
  hoverColor: string;
  exploreMore: boolean;
}

export default function CategoryCard({
  name,
  slug,
  image,
  hoverColor,
  exploreMore
}: CategoryCardProps) {
  return (
    <Link 
      href={`/categories/${slug}`}
      className="group block relative rounded-2xl overflow-hidden aspect-[4/5] bg-gray-100 isolate shadow-sm hover:shadow-xl transition-all duration-500"
      style={{
        '--hover-bg': hoverColor,
      } as React.CSSProperties}
    >
      {/* Background Image */}
      <Image 
        src={image} 
        alt={name} 
        fill sizes="(max-width: 768px) 50vw, 25vw" 
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 z-0"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-60" />
      
      {/* Hover Color Overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500 mix-blend-multiply z-10"
        style={{ backgroundColor: 'var(--hover-bg)' }}
      />

      {/* Content */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 sm:p-8">
        <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
          {name}
        </h3>
        
        {exploreMore && (
          <div className="overflow-hidden h-0 group-hover:h-8 transition-all duration-500 ease-in-out flex items-center">
            <span className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white mt-2">
              Explore More <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
