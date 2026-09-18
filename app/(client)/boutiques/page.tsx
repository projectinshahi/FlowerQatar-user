import React from 'react';
import Image from 'next/image';
import Breadcrumbs from '../../../components/Breadcrumbs';

export const metadata = {
  title: 'Our Boutiques',
  description: 'Visit our exclusive Lebami boutiques worldwide and experience the beauty of Eternity® Roses in person.',
};

const boutiques = [
  {
    city: 'DOHA',
    name: 'Lebami Flagship Boutique',
    address: 'Place Vendôme Mall, Gate 2, Ground Floor',
    location: 'Lusail, Qatar',
    hours: 'Mon-Sun: 10:00 AM - 10:00 PM',
    phone: '+974 4000 0000',
    image: '/images/explore_stores_1782905783786.png'
  },
  {
    city: 'PARIS',
    name: 'Galeries Lafayette',
    address: '40 Boulevard Haussmann, 2nd Floor',
    location: '75009 Paris, France',
    hours: 'Mon-Sat: 10:00 AM - 8:30 PM\nSun: 11:00 AM - 8:00 PM',
    phone: '+33 1 40 23 52 00',
    image: '/images/hero_background_1782286769476.png'
  },
  {
    city: 'NEW YORK',
    name: 'Madison Avenue',
    address: '845 Madison Avenue',
    location: 'New York, NY 10021, USA',
    hours: 'Mon-Sat: 10:00 AM - 7:00 PM\nSun: 12:00 PM - 6:00 PM',
    phone: '+1 212-555-0198',
    image: '/images/about_florist_1782290182382.png'
  }
];

export default function BoutiquesPage() {
  return (
    <div className="w-full mx-auto font-sans text-primary">
      <div className="px-6 pt-8 pb-4">
        <Breadcrumbs items={[{ label: 'Boutiques', href: '/boutiques' }]} />
      </div>

      {/* Hero Section */}
      <div className="relative w-full overflow-hidden border-y border-divider/60 py-24 md:py-32 px-8 text-center mb-16">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/explore_stores_1782905783786.png')" }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        
        <div className="relative z-10">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C1A87D] font-semibold block mb-4">
            Visit Us
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-wide text-white mb-6">
            Our Boutiques
          </h1>
          <p className="text-xs md:text-sm text-white/95 max-w-lg mx-auto leading-relaxed">
            Step into the world of Lebami. Experience our exquisite arrangements, exclusive fragrances, and bespoke services in person at our international locations.
          </p>
        </div>
      </div>

      {/* Boutiques Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {boutiques.map((boutique, index) => (
            <div key={index} className="flex flex-col border border-divider/40 group hover:border-primary/20 transition-colors duration-500">
              <div className="relative w-full h-[300px] overflow-hidden">
                <Image 
                  src={boutique.image} 
                  alt={boutique.name}
                  fill sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-1000"
                />
              </div>
              <div className="p-8 flex flex-col flex-grow bg-white text-center">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-secondary mb-4">{boutique.city}</span>
                <h3 className="font-serif text-2xl text-primary mb-2">{boutique.name}</h3>
                <p className="text-xs text-muted mb-6">{boutique.address}<br />{boutique.location}</p>
                
                <div className="mt-auto space-y-4 pt-6 border-t border-divider/30">
                  <div className="text-[11px] leading-relaxed text-primary">
                    <p className="font-semibold uppercase tracking-widest mb-1 text-[9px] text-muted">Store Hours</p>
                    {boutique.hours.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  <div className="text-[11px] text-primary">
                    <p className="font-semibold uppercase tracking-widest mb-1 text-[9px] text-muted">Contact</p>
                    <p>{boutique.phone}</p>
                  </div>
                  
                  <button className="w-full mt-6 py-3 border border-secondary text-[10px] uppercase tracking-widest text-secondary hover:bg-secondary hover:text-white transition-colors duration-300">
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
