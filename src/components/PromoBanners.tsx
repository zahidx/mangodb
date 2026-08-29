"use client";

import { PromoBannersSkeleton } from "@/components/skeletons";
import { ArrowRight, Sparkles, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  position: string;
  sort_order: number;
  is_active: boolean;
}

const DEFAULT_PROMO_BANNERS: Banner[] = [
  {
    id: "promo-1",
    title: "100% Tree-Ripened Guarantee",
    subtitle: "Naturally matured under the Rajshahi sun. Zero artificial chemicals or carbide accelerants.",
    image_url: "https://images.unsplash.com/photo-1550828520-4cb496926fc9?w=800&auto=format&fit=crop&q=80",
    link_url: "/products?category=mango",
    position: "promo",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "promo-2",
    title: "Curated Wooden Gift Crates",
    subtitle: "Eco-ventilated packaging designed for family gifting and corporate seasonal hampers.",
    image_url: "https://images.unsplash.com/photo-1598144073024-db080e7bbfa8?w=800&auto=format&fit=crop&q=80",
    link_url: "/products",
    position: "offer",
    sort_order: 2,
    is_active: true,
  }
];

export default function PromoBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPromoBanners() {
      try {
        const res = await fetch("/api/admin/banners");
        const result = await res.json();
        if (res.ok && result.data && result.data.length > 0) {
          const promoBanners = result.data
            .filter(
              (b: Banner) =>
                (b.position === "promo" || b.position === "offer") && b.is_active
            )
            .sort((a: Banner, b: Banner) => a.sort_order - b.sort_order);
          setBanners(promoBanners.length > 0 ? promoBanners : DEFAULT_PROMO_BANNERS);
        } else {
          setBanners(DEFAULT_PROMO_BANNERS);
        }
      } catch (err) {
        setBanners(DEFAULT_PROMO_BANNERS);
      } finally {
        setLoading(false);
      }
    }
    loadPromoBanners();
  }, []);

  if (loading) {
    return <PromoBannersSkeleton />;
  }

  if (banners.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 relative z-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {banners.map((banner) => (
          <Link
            key={banner.id}
            href={banner.link_url || "/products"}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all duration-300 flex flex-col sm:flex-row h-auto sm:h-52 cursor-pointer shadow-sm hover:shadow-md"
          >
            {/* Left/Top Content */}
            <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 z-10">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider ${
                      banner.position === "offer"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                    }`}
                  >
                    {banner.position === "offer" ? "Limited Seasonal Crate" : "Quality Standard"}
                  </span>
                </div>

                <h3 className="font-bold text-hero-text text-base sm:text-lg leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {banner.title}
                </h3>

                {banner.subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                    {banner.subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-hero-text group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                <span>View Collection</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>

            {/* Right/Bottom Image */}
            <div className="relative w-full sm:w-48 h-40 sm:h-full shrink-0 overflow-hidden bg-muted-bg">
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                sizes="(max-width: 640px) 100vw, 240px"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-l from-transparent via-transparent to-card/60 sm:to-card z-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
