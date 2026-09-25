import type { Metadata } from "next";
import "../globals.css";
import ScrollToTop from "../../components/ScrollToTop";

export const metadata: Metadata = {
  title: "Admin Portal | Lebami",
  description: "Secure administration portal",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-gray-900 min-h-screen selection:bg-primary/20 selection:text-primary" suppressHydrationWarning>
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
