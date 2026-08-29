"use client";

import { HeroBannerSkeleton } from "@/components/skeletons";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

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

const DEFAULT_BANNERS: Banner[] = [
  {
    id: "default-1",
    title: "Orchard Fresh Rajshahi Mangoes",
    subtitle: "Tree-ripened, 100% formalin & carbide free. Handpicked from certified safe orchards and delivered to your doorstep within 48 hours.",
    image_url: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=1600&auto=format&fit=crop&q=85",
    link_url: "/products",
    position: "hero",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "default-2",
    title: "Handpicked Premium Himsagar & Lengra",
    subtitle: "Experience the authentic sweetness of northern Bangladesh. Packed in eco-ventilated cushioned crates for flawless freshness.",
    image_url: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=1600&auto=format&fit=crop&q=85",
    link_url: "/products?category=mango",
    position: "hero",
    sort_order: 2,
    is_active: true,
  }
];

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    async function loadBanners() {
      try {
        const res = await fetch("/api/admin/banners");
        const result = await res.json();
        if (res.ok && result.data && result.data.length > 0) {
          const heroBanners = result.data
            .filter((b: Banner) => b.position === "hero" && b.is_active)
            .sort((a: Banner, b: Banner) => a.sort_order - b.sort_order);
          setBanners(heroBanners.length > 0 ? heroBanners : DEFAULT_BANNERS);
        } else {
          setBanners(DEFAULT_BANNERS);
        }
      } catch (err) {
        setBanners(DEFAULT_BANNERS);
      } finally {
        setLoading(false);
      }
    }
    loadBanners();
  }, []);

  // Auto-slide every 6 seconds
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (loading) {
    return <HeroBannerSkeleton />;
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full overflow-hidden bg-neutral-950 select-none">
      <div
        className="relative w-full h-[460px] sm:h-[540px] md:h-[620px] overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        {banners.map((banner, idx) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              idx === currentIndex ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105"
            }`}
            style={{ transitionProperty: "opacity, transform" }}
          >
            <Image
              src={
                banner.image_url.startsWith("/") && banner.image_url.includes("?")
                  ? banner.image_url.split("?")[0]
                  : banner.image_url
              }
              alt={banner.title}
              fill
              className="object-cover object-center"
              priority={idx === 0}
              sizes="100vw"
            />
            {/* Cinematic Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent z-10" />

            {/* Editorial Content */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end max-w-7xl mx-auto px-6 sm:px-10 md:px-14 pb-10 sm:pb-14 md:pb-16">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-[11px] font-mono uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Direct Orchard Harvest · 2026 Season
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.08] drop-shadow-sm">
                  {banner.title}
                </h1>

                {banner.subtitle && (
                  <p className="text-sm sm:text-base md:text-lg text-white/80 mt-3 sm:mt-4 leading-relaxed max-w-2xl font-normal drop-shadow">
                    {banner.subtitle}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                  {banner.link_url ? (
                    <Link
                      href={banner.link_url}
                      className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
                    >
                      <span>Shop Fresh Harvest</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link
                      href="/products"
                      className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
                    >
                      <span>Explore Products</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  <Link
                    href="/products?sort=popular"
                    className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-medium text-xs sm:text-sm rounded-xl transition-all active:scale-98 cursor-pointer"
                  >
                    <span>View Varieties</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Minimalist Navigation Arrows */}
        {banners.length > 1 && (
          <div className="absolute right-6 bottom-6 sm:right-10 sm:bottom-10 z-30 flex items-center gap-2">
            <button
              onClick={goPrev}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goNext}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label="Next banner"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Slide Progress Indicators */}
        {banners.length > 1 && (
          <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-30 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="ml-1 text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
