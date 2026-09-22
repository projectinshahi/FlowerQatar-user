import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "../globals.css";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "../../lib/site";
import JsonLd from "../../components/seo/JsonLd";
import { AppContextProvider } from "../../context/AppContext";
import CartDrawer from "../../components/CartDrawer";
import AccountDrawer from "../../components/AccountDrawer";
import SearchDrawer from "../../components/SearchDrawer";
import ToastContainer from "../../components/ToastContainer";
import Navbar from "../sections/Navbar";
import Footer from "../sections/Footer";
import { getNavMenu } from "../../lib/subcategories";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import Analytics from "../../components/analytics/Analytics";
import GoogleTranslate from "../../components/GoogleTranslate";
import TranslateSync from "../../components/TranslateSync";
import MotionPreferences from "../../components/MotionPreferences";

// Lazy, client-only — it self-fetches and only renders when configured + first session view.
const WelcomePopup = dynamic(() => import("../../components/WelcomePopup"));
const LiveUpdates = dynamic(() => import("../../components/LiveUpdates"));

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
  const navMenu = await getNavMenu();
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
          Runs before anything paints. When the visitor is in Arabic it masks the body so the
          untranslated English frame is never visible, and arms its own timeout so a blocked
          or failed translate script can never leave the page hidden — that safety net is
          independent of React deliberately, because React may never mount.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var m=document.cookie.match(/(?:^|;\\s*)googtrans=([^;]+)/);
              if(!decodeURIComponent(m&&m[1]||'').endsWith('/ar'))return;
              var h=document.documentElement;
              h.setAttribute('data-translating','boot');
              h.lang='ar';
              setTimeout(function(){h.removeAttribute('data-translating')},2500);
            }catch(e){}})();`,
          }}
        />
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
        <AppContextProvider>
          <MotionPreferences>
          {/* Keyboard users jump past the navigation; invisible until focused. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-white focus:px-5 focus:py-2.5 focus:text-xs focus:uppercase focus:tracking-widest focus:text-primary focus:shadow-lg"
          >
            Skip to content
          </a>
          <Navbar menu={navMenu} />
          <main id="main" className="flex-grow">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <AccountDrawer />
          <SearchDrawer />
          <ToastContainer />
          <WelcomePopup />
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
