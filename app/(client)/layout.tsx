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
import dynamic from "next/dynamic";

// Lazy, client-only — it self-fetches and only renders when configured + first session view.
const WelcomePopup = dynamic(() => import("../../components/WelcomePopup"));

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
  title: "Lebami | Preserved Eternity® Roses",
  description: "Experience the original Eternity® Roses, handcrafted luxury arrangements of real roses that last a year.",
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable} h-full antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans antialiased selection:bg-primary/20 selection:text-primary overflow-x-hidden" suppressHydrationWarning>
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
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <AccountDrawer />
          <SearchDrawer />
          <ToastContainer />
          <WelcomePopup />
        </AppContextProvider>
      </body>
    </html>
  );
}
