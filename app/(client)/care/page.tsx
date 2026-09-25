
import React from 'react';
import { Sparkles, SunDim, Droplets, Smile, Ban, Scissors } from 'lucide-react';
import Breadcrumbs from '../../../components/Breadcrumbs';

export default function CareGuidePage() {
  const INSTRUCTIONS = [
    {
      icon: Droplets,
      title: 'Do Not Water the Roses',
      desc: 'Watering preserved roses will dissolve the preservation glycerin and cause petals to lose color and structural rigidity. Keep them dry at all times.',
    },
    {
      icon: SunDim,
      title: 'Avoid Direct Sunlight & Heat',
      desc: 'Prolonged exposure to solar rays or placing arrangements next to high-heat radiators will fade the color dyes and dehydrate the petals.',
    },
    {
      icon: Ban,
      title: 'Do Not Remove from Box',
      desc: 'Our floral designers arrange each rose carefully in hatboxes. Removing them will destroy the structural grid support and damage the stems.',
    },
    {
      icon: Scissors,
      title: 'Do Not Trim or Handle Petals',
      desc: 'Preserved roses are delicate. Handling or touching them constantly can oil or tear the petals. Do not attempt to prune or trim them.',
    },
    {
      icon: Sparkles,
      title: 'Dust Gently with Soft Brush',
      desc: 'If dust gathers over months, use a soft makeup brush, clean paintbrush, or a light stream of cool dry air from a hairdryer to dust them off.',
    },
    {
      icon: Smile,
      title: 'Maintain Normal Humidity & Temp',
      desc: 'Optimal environment is room temperature (60-72°F / 18-22°C) with standard humidity levels (55%-65%). Avoid damp cellars or dry attics.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 pb-8 page-below-header font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Care Guide', href: '/care' }]} />

      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-16 mt-4">
        <span className="text-xs uppercase tracking-[0.25em] text-secondary font-light block mb-2">
          Product Care
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-medium tracking-wide">
          Eternity® Care Guide
        </h1>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          Eternity® preserved roses require zero watering or soil, maintaining their natural freshness for an entire year when following these simple steps.
        </p>
      </div>

      {/* Instructions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {INSTRUCTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-cream/40 border border-divider p-6 text-center space-y-4 rounded-none">
              <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary border border-secondary/20 flex items-center justify-center mx-auto">
                <Icon size={18} className="stroke-[1.5]" />
              </div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-primary">
                {item.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Editorial footer block */}
      <div className="bg-cream border border-divider p-8 text-center max-w-3xl mx-auto rounded-none space-y-3">
        <h3 className="font-serif text-xl font-medium tracking-wide text-primary">
          Handcrafted to Last a Year
        </h3>
        <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
          By sealing botanical freshness during Ecuadorian peak harvest, we guarantee beauty that sustains. For additional queries, reach out to our concierge.
        </p>
      </div>
    </div>
  );
}
