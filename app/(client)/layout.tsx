import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "../globals.css";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "../../lib/site";
import JsonLd from "../../components/seo/JsonLd";
import { AppContextProvider } from "../../context/AppContext";
import DeferredOverlays from "../../components/DeferredOverlays";
import ToastContainer from "../../components/ToastContainer";
import Navbar from "../sections/Navbar";
import Footer from "../sections/Footer";
import { getNavMenu } from "../../lib/subcategories";
import { getPromotionBar } from "../../lib/promotions";
import { bootLanguageScript } from "../../lib/translate";
import { Suspense } from "react";
import Analytics from "../../components/analytics/Analytics";
import GoogleTranslate from "../../components/GoogleTranslate";
import TranslateSync from "../../components/TranslateSync";
import MotionPreferences from "../../components/MotionPreferences";
import WhatsAppButton from "../../components/WhatsAppButton";
import ScrollToTop from "../../components/ScrollToTop";
import LiveUpdates from "../../components/LiveUpdates";

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

const montserrat = Montserrat({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Child pages set a bare title (e.g. a product name); the template appends the brand.
  title: {
    default: "Lebami | Preserved Eternity® Roses",
    template: "%s | Lebami",
  },
  description: "Experience the original Eternity® Roses, handcrafted luxury arrangements of real roses that last a year.",
  applicationName: SITE_NAME,
  // No site-wide canonical here: it was inherited by every page without its own, pointing
  // /shop, every category listing, /collections and others at the home page as duplicates.
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "en_US",
    title: "Lebami | Preserved Eternity® Roses",
    description: "Experience the original Eternity® Roses, handcrafted luxury arrangements of real roses that last a year.",
    images: [{ url: "/images/lebami.png", alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lebami | Preserved Eternity® Roses",
    description: "Experience the original Eternity® Roses, handcrafted luxury arrangements of real roses that last a year.",
    images: ["/images/lebami.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [navMenu, promotionBar] = await Promise.all([getNavMenu(), getPromotionBar()]);
  return (
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable} h-full antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Google's translator is a third-party origin; warming the connection cuts a chunk
            off how long the page sits masked waiting for the first pass. */}
        <link rel="preconnect" href="https://translate.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://translate.google.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://translate.googleapis.com" />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased selection:bg-primary/20 selection:text-primary overflow-x-hidden" suppressHydrationWarning>
        {/*
          Runs before anything paints: <html> gets the selected language's lang and dir from the
          googtrans cookie (the one source of truth, see lib/translate.ts), so the page never
          starts in the wrong language and switches after hydration.
        */}
        <script dangerouslySetInnerHTML={{ __html: bootLanguageScript }} />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/images/lebami.png`,
              description: SITE_DESCRIPTION,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              url: SITE_URL,
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />
        {/* Every route starts at the top; see the component for why Next does not. */}
        <ScrollToTop />
        <AppContextProvider>
          <MotionPreferences>
          <Navbar menu={navMenu} promotionBar={promotionBar} />
          <main id="main" className="flex-grow">
            {children}
          </main>
          <Footer />
          {/*
            Outside <main>, deliberately. The page itself is wrapped by template.tsx in
            .page-enter, whose animation leaves a transform on the element - and a
            transformed ancestor makes `position: fixed` resolve against THAT box instead of
            the viewport, so the button scrolled away with the page. Here it has no
            transformed ancestor, and it reaches every route rather than just the home page.
          */}
          <WhatsAppButton />
          <ToastContainer />
          {/* Cart, account and search drawers and the welcome popup: loaded after the page starts. */}
          <DeferredOverlays />
          {/* Re-renders the page when an admin changes what it shows (Socket.IO, server.mjs). */}
          <LiveUpdates />
          <GoogleTranslate />
          {/* Re-applies the translation after client-side navigation. Needs Suspense because
              it reads searchParams, which opts its subtree into dynamic rendering. */}
          <Suspense fallback={null}>
            <TranslateSync />
          </Suspense>
          </MotionPreferences>
        </AppContextProvider>
      </body>
    </html>
  );
}
