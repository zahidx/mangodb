import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import MarketingScripts from "@/components/MarketingScripts";
import BackToTop from "@/components/BackToTop";
import CookieConsent from "@/components/CookieConsent";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MangoDB — Premium Rajshahi Mangoes Delivered",
    template: "%s | MangoDB",
  },
  description:
    "Buy fresh, premium carbide-free mangoes online. Handpicked Himsagar, Lengra, Haribhanga and more delivered directly from Rajshahi to your doorstep.",
  keywords: ["mangoes bangladesh", "rajshahi mango", "himsagar mango", "lengra", "fresh mango delivery", "carbide-free mangoes", "MangoDB"],
  authors: [{ name: "MangoDB" }],
  openGraph: {
    title: "MangoDB — Premium Rajshahi Mangoes Delivered",
    description:
      "Buy fresh, premium carbide-free mangoes online. Handpicked Himsagar, Lengra, Haribhanga and more delivered directly from Rajshahi to your doorstep.",
    type: "website",
    locale: "en_US",
    siteName: "MangoDB",
    images: [
      {
        url: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=1200&h=630&fit=crop&q=80",
        width: 1200,
        height: 630,
        alt: "MangoDB Premium Harvest",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MangoDB — Premium Rajshahi Mangoes",
    description: "Handpicked premium mangoes delivered from orchard to your doorstep.",
    images: ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=1200&h=630&fit=crop&q=80"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${outfit.variable} dark h-full antialiased overflow-x-hidden`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('mangodb-theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else if (theme === 'dark') {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    localStorage.setItem('mangodb-theme', 'light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--card)",
              color: "var(--card-foreground)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-lg)",
            },
          }}
        />
        <WhatsAppWidget />
        <BackToTop />
        <CookieConsent />
        <MarketingScripts />
      </body>
    </html>
  );
}
