"use client";

import { ArrowRight, Loader2, Tag } from "lucide-react";
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

export default function PromoBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPromoBanners() {
      try {
        const res = await fetch("/api/admin/banners");
        const result = await res.json();
        if (res.ok && result.data) {
          const promoBanners = result.data
            .filter(
              (b: Banner) =>
                (b.position === "promo" || b.position === "offer") && b.is_active
            )
            .sort(
              (a: Banner, b: Banner) => a.sort_order - b.sort_order
            );
          setBanners(promoBanners);
        }
      } catch (err) {
        console.error("Failed to load promo banners:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPromoBanners();
  }, []);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-center h-32 bg-white/50 border border-gray-100 rounded-xl">
          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
        </div>
      </section>
    );
  }

  if (banners.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 mt-8 relative z-20">
      {/* Promo & Offer Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {banners.map((banner) => (
          <Link
            key={banner.id}
            href={banner.link_url || "#"}
            className={`group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 ${
              !banner.link_url ? "cursor-default" : "cursor-pointer"
            }`}
          >
            {/* Background Image */}
            <div className="relative h-44 sm:h-48 w-full">
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Position Badge */}
              <div className="absolute top-3 left-3 z-10">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                    banner.position === "offer"
                      ? "bg-rose-500 text-white"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {banner.position === "offer" ? "Limited Offer" : "Promotion"}
                </span>
              </div>
            </div>

            {/* Text Content */}
            <div className="p-4 sm:p-5">
              <h3 className="font-sans font-bold text-gray-800 text-sm sm:text-base leading-tight">
                {banner.title}
              </h3>
              {banner.subtitle && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                  {banner.subtitle}
                </p>
              )}
              {banner.link_url && (
                <div className="flex items-center gap-1 mt-3 text-[11px] font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors">
                  Learn More
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
