import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "../globals.css";
import { AppContextProvider } from "../../context/AppContext";
import CartDrawer from "../../components/CartDrawer";
import AccountDrawer from "../../components/AccountDrawer";
import SearchDrawer from "../../components/SearchDrawer";
import ToastContainer from "../../components/ToastContainer";
import Navbar from "../sections/Navbar";
import Footer from "../sections/Footer";

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
  title: "Lebami | Preserved Eternity® Roses",
  description: "Experience the original Eternity® Roses, handcrafted luxury arrangements of real roses that last a year.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans antialiased selection:bg-primary/20 selection:text-primary overflow-x-hidden">
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
        </AppContextProvider>
      </body>
    </html>
  );
}
