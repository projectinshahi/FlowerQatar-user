import dynamic from 'next/dynamic'
import Hero from '../sections/Hero'
import BannerSection from '../sections/BannerSection'
import { getNewArrivalItems, getExploreGardenItems } from '../../lib/store-products'
import { getActiveBanners } from '../../lib/actions/banner.actions'
import { getFeaturedOccasion } from '../../lib/occasions'
import { getActivePromotions } from '../../lib/promotions'
import { getSubscriptionPlans } from '../../lib/subscription-plans'
import ShopByOccasion from '../../components/home/ShopByOccasion'
import SubscriptionPlans from '../../components/home/SubscriptionPlans'

// Dynamically import below-the-fold client components to drastically reduce initial JS payload and hydration lag
const NewArrivals = dynamic(() => import('../sections/NewArrivals'))
const SignatureCollections = dynamic(() => import('../sections/SignatureCollections'))
const ExploreGardens = dynamic(() => import('../sections/ExploreGardens'))
const LovedByIcons = dynamic(() => import('../sections/LovedByIcons'))
const BrandStory = dynamic(() => import('../sections/BrandStory'))
const ArtTriptych = dynamic(() => import('../sections/ArtTriptych'))

// Refresh homepage product data periodically without a redeploy.
export const revalidate = 60

export default async function Home() {
  const [newArrivals, banners, exploreGarden, featuredOccasion, subscriptionPlans, promotions] = await Promise.all([
    getNewArrivalItems(8),
    getActiveBanners(),
    getExploreGardenItems(),
    getFeaturedOccasion(),
    getSubscriptionPlans(),
    getActivePromotions(),
  ])
  const promoTitles = promotions.map((p) => p.title)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Admin-managed banner is the hero. Falls back to the marketing Hero when no active banner exists. */}
      {banners.length > 0 ? <BannerSection banners={banners} promotions={promoTitles} /> : <Hero />}
      {/* Admin's featured collection. Renders nothing when none is featured. */}
      <ShopByOccasion occasion={featuredOccasion} />
      <NewArrivals items={newArrivals} />
      <SignatureCollections />
      <ExploreGardens items={exploreGarden} />
      {/* The three fixed subscription plans (Silver / Gold / Platinum). */}
      <SubscriptionPlans plans={subscriptionPlans} />
      {/* <LovedByIcons /> */}
      <BrandStory />
      <ArtTriptych />
    </div>
  )
}
