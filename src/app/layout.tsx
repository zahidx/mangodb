import BackToTop from "@/components/BackToTop";
import CartRecoveryPrompt from "@/components/CartRecoveryPrompt";
import CompareBar from "@/components/CompareBar";
import CookieConsent from "@/components/CookieConsent";
import MarketingScripts from "@/components/MarketingScripts";
import Providers from "@/components/Providers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono, Outfit, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
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

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "MangoDB — Premium Rajshahi Mangoes Delivered",
    template: "%s | MangoDB",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MangoDB",
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
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${outfit.variable} ${fraunces.variable} dark h-full antialiased overflow-x-hidden`}
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
        {/* JSON-LD Structured Data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MangoDB",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://mangodb.com",
              logo: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=200&h=200&fit=crop&q=80",
              description: "Premium Rajshahi mangoes delivered fresh from orchard to doorstep.",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+880-1700-000000",
                contactType: "customer service",
                availableLanguage: ["English", "Bengali"],
              },
              sameAs: [
                "https://facebook.com/mangodb",
                "https://instagram.com/mangodb",
              ],
            }),
          }}
        />
        {/* JSON-LD — WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MangoDB",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://mangodb.com",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://mangodb.com"}/products?search={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden" suppressHydrationWarning>
        <Providers>
          {children}
          <CompareBar />
          <CartRecoveryPrompt />
        </Providers>
        <Toaster
          position="bottom-center"
          gutter={12}
          containerClassName="mangodb-toaster"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: "14px",
              padding: "14px 18px",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "var(--font-sans, system-ui)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            },
            success: {
              style: {
                background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                color: "#065f46",
                border: "1px solid #a7f3d0",
              },
              iconTheme: {
                primary: "#10b981",
                secondary: "#ecfdf5",
              },
            },
            error: {
              style: {
                background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                color: "#991b1b",
                border: "1px solid #fecaca",
              },
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fef2f2",
              },
            },
            loading: {
              style: {
                background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                color: "#075985",
                border: "1px solid #bae6fd",
              },
            },
          }}
        />
        <ServiceWorkerRegister />
        <BackToTop />
        <CookieConsent />
        <MarketingScripts />
      </body>
    </html>
  );
}
