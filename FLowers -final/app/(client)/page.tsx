import dynamic from 'next/dynamic'
import Hero from '../sections/Hero'

// Dynamically import below-the-fold client components to drastically reduce initial JS payload and hydration lag
const PressMarquee = dynamic(() => import('../sections/PressMarquee'))
const NewArrivals = dynamic(() => import('../sections/NewArrivals'))
const MatiMarine = dynamic(() => import('../sections/MatiMarine'))
const EternityRoses = dynamic(() => import('../sections/EternityRoses'))
const ExploreGardens = dynamic(() => import('../sections/ExploreGardens'))
const LovedByIcons = dynamic(() => import('../sections/LovedByIcons'))
const BrandStory = dynamic(() => import('../sections/BrandStory'))
const ArtTriptych = dynamic(() => import('../sections/ArtTriptych'))

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <PressMarquee />
      <NewArrivals />
      <MatiMarine />
      <EternityRoses />
      <ExploreGardens />
      <LovedByIcons />
      <BrandStory />
      <ArtTriptych />
    </div>
  )
}
