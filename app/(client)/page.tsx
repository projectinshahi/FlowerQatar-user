import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import BannerSection from '../sections/BannerSection'
import { getNewArrivalItems, getExploreGardenItems } from '../../lib/store-products'
import { getActiveBanners } from '../../lib/actions/banner.actions'
import { getFeaturedOccasion } from '../../lib/occasions'
import { getPromotionBar } from '../../lib/promotions'
import { getSubscriptionPlans } from '../../lib/subscription-plans'
import ShopByOccasion from '../../components/home/ShopByOccasion'
import SubscriptionPlans from '../../components/home/SubscriptionPlans'
import ScrollToHash from '../../components/ScrollToHash'
import {
  HeroSkeleton,
  ShopByOccasionSkeleton,
  NewArrivalsSkeleton,
  ExploreGardensSkeleton,
  SubscriptionPlansSkeleton,
} from '../../components/skeletons/HomeSkeletons'

// Dynamically import below-the-fold client components to drastically reduce initial JS payload and hydration lag
const NewArrivals = dynamic(() => import('../sections/NewArrivals'))
const SignatureCollections = dynamic(() => import('../sections/SignatureCollections'))
const ExploreGardens = dynamic(() => import('../sections/ExploreGardens'))
const BrandStory = dynamic(() => import('../sections/BrandStory'))
const ArtTriptych = dynamic(() => import('../sections/ArtTriptych'))

// Refresh homepage product data periodically without a redeploy.
export const revalidate = 60

// The home page's own canonical (the layout no longer sets one for every page).
export const metadata = { alternates: { canonical: '/' } }

/*
 * Each section owns its own await and its own Suspense boundary. Previously a single
 * Promise.all held the whole page back until the slowest query returned; now the static
 * sections paint immediately and each data-driven one swaps its skeleton for content as
 * soon as its own query resolves.
 */

async function BannerSlot() {
  const [banners, promotionBar] = await Promise.all([getActiveBanners(), getPromotionBar()])
  // The admin-managed banner is the hero; BannerSection shows a still poster when none is active.
  return <BannerSection banners={banners} promotionBar={promotionBar} />
}

async function OccasionSlot() {
  // Admin's featured collection. Renders nothing when none is featured.
  return <ShopByOccasion occasion={await getFeaturedOccasion()} />
}

async function NewArrivalsSlot() {
  return <NewArrivals items={await getNewArrivalItems(8)} />
}

async function ExploreGardensSlot() {
  return <ExploreGardens items={await getExploreGardenItems()} />
}

async function SubscriptionPlansSlot() {
  // The three fixed subscription plans (Silver / Gold / Platinum).
  return <SubscriptionPlans plans={await getSubscriptionPlans()} />
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<HeroSkeleton />}>
        <BannerSlot />
      </Suspense>

      <Suspense fallback={<ShopByOccasionSkeleton />}>
        <OccasionSlot />
      </Suspense>

      <Suspense fallback={<NewArrivalsSkeleton />}>
        <NewArrivalsSlot />
      </Suspense>

      <SignatureCollections />

      <Suspense fallback={<ExploreGardensSkeleton />}>
        <ExploreGardensSlot />
      </Suspense>

      <Suspense fallback={<SubscriptionPlansSkeleton />}>
        <SubscriptionPlansSlot />
      </Suspense>

      <BrandStory />
      <ArtTriptych />

      {/* Sections stream in, so a /#hash link has to wait for its target before scrolling. */}
      <ScrollToHash />
    </div>
  )
}
