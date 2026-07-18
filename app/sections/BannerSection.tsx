interface BannerItem {
  id: string
  title: string | null
  subheading: string | null
  description: string | null
  videoUrl: string
}

export default function BannerSection({ banners }: { banners: BannerItem[] }) {
  if (!banners?.length) return null

  return (
    
    <>
      {banners.map((banner) => (
        <section
          key={banner.id}
          aria-label={banner.title || "Featured banner"}
          className="relative w-full h-[75vh] md:h-[95vh] lg:h-screen min-h-[600px] overflow-hidden bg-secondary"
        >
          {/* Background video (fixed height => no layout shift; muted+playsInline => reliable autoplay) */}
          <video
            src={banner.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />

          {/* Gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent pointer-events-none" />

          {/* Content */}
          {(banner.title || banner.subheading || banner.description) && (
            <div className="absolute inset-0 flex items-center">
              <div className="w-full max-w-[1280px] mx-auto px-6 md:px-12">
                <div className="flex flex-col max-w-[560px] text-white">
               
                  {banner.title && (
                    <b>
                    <h1 className="font-serif text-[40px] md:text-[56px] font-light tracking-[0.05em] leading-[1.1]">
                      
                      {banner.title}
                    </h1>
                    </b>
                  )}
                     {banner.subheading && (
                    <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-white/90 mb-5">
                      {banner.subheading}
                    </p>
                  )}
                  {banner.description && (
                    <p className="font-sans text-[15px] md:text-[16px] text-white/85 mt-5 leading-[1.6]">
                      {banner.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      ))}
    </>
  )
}
