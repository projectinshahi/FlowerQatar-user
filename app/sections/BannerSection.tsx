import PromotionBar from "../../components/PromotionBar"
import { videoPoster } from "@/lib/media"
import { PROMOTION_BAR_DEFAULTS, type PromotionBarTheme } from "@/lib/promotions"

/** What each text element falls back to when the admin has not chosen a colour. */
export const DEFAULT_BANNER_TEXT_COLOR = "#ffffff"

interface BannerItem {
  id: string
  title: string | null
  subheading: string | null
  description: string | null
  /** Admin-set hex colours, one per text element; null falls back to white. */
  titleColor: string | null
  subheadingColor: string | null
  descriptionColor: string | null
  videoUrl: string
}

export default function BannerSection({
  banners,
  promotions = [],
  promotionTheme = PROMOTION_BAR_DEFAULTS,
}: {
  banners: BannerItem[]
  promotions?: string[]
  promotionTheme?: PromotionBarTheme
}) {
  if (!banners?.length) return null

  return (

    <>
      {banners.map((banner, i) => {
        /*
         * One <h1> per page: the first banner's title. Every banner used to render an <h1>
         * (wrapped in an inline <b>, which is invalid around a heading and did not change its
         * weight — the heading's own font-light applies), so a page with several banners had
         * several h1s and one with an untitled first banner had none.
         */
        const Title = i === 0 ? 'h1' : 'h2'
        return (
        <section
          key={banner.id}
          aria-label={banner.title || "Featured banner"}
          className="relative w-full h-[75vh] md:h-[95vh] lg:h-screen min-h-[600px] overflow-hidden bg-secondary"
        >
          {/*
            Background video (fixed height => no layout shift; muted+playsInline => reliable autoplay).

            `preload="auto"` told the browser to fetch the ENTIRE file before anything else could
            use the connection — measured at 5.8MB for the current banner, on the critical path of
            the home page's largest element. "metadata" fetches only enough to start playing, and
            the Cloudinary poster frame (a still, tens of KB) paints immediately instead of a black
            box, so the hero has something on screen while the video streams in behind it.
          */}
          <video
            src={banner.videoUrl}
            poster={videoPoster(banner.videoUrl)}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />

          {/* Gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent pointer-events-none" />

          {/* Content */}
          {(banner.title || banner.subheading || banner.description) && (
            <div className="absolute inset-0 flex items-center">
              <div className="w-full max-w-[1280px] mx-auto px-6 md:px-12">
                <div className="flex flex-col max-w-[560px]">
               
                  {banner.title && (
                    <Title
                      className="font-serif text-[40px] md:text-[56px] font-light tracking-[0.05em] leading-[1.1]"
                      style={{ color: banner.titleColor || DEFAULT_BANNER_TEXT_COLOR }}
                    >
                      {banner.title}
                    </Title>
                  )}
                     {banner.subheading && (
                    <p
                      className="font-sans text-[11px] uppercase tracking-[0.2em] mb-5"
                      style={{ color: banner.subheadingColor || DEFAULT_BANNER_TEXT_COLOR }}
                    >
                      {banner.subheading}
                    </p>
                  )}
                  {banner.description && (
                    <p
                      className="font-sans text-[15px] md:text-[16px] mt-5 leading-[1.6]"
                      style={{ color: banner.descriptionColor || DEFAULT_BANNER_TEXT_COLOR }}
                    >
                      {banner.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active promotions ticker, pinned to the bottom edge of the banner */}
          <PromotionBar items={promotions} theme={promotionTheme} />
        </section>
        )
      })}
    </>
  )
}
