import Navbar from './sections/Navbar'
import Hero from './sections/Hero'
import PressMarquee from './sections/PressMarquee'
import NewArrivals from './sections/NewArrivals'
import MatiMarine from './sections/MatiMarine'
import EternityRoses from './sections/EternityRoses'
import ExploreGardens from './sections/ExploreGardens'
import LovedByIcons from './sections/LovedByIcons'
import BrandStory from './sections/BrandStory'
import ArtTriptych from './sections/ArtTriptych'
import Footer from './sections/Footer'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Hero />
      <PressMarquee />
      <NewArrivals />
      <MatiMarine />
      <EternityRoses />
      <ExploreGardens />
      <LovedByIcons />
      <BrandStory />
      <ArtTriptych />
      <Footer />
    </div>
  )
}
