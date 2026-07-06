"use client";

import { HeroBannerSkeleton } from "@/components/skeletons";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
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
        // Use the public API or directly query Supabase for active hero banners
        const res = await fetch("/api/admin/banners");
        const result = await res.json();
        if (res.ok && result.data) {
          const heroBanners = result.data
            .filter((b: Banner) => b.position === "hero" && b.is_active)
            .sort((a: Banner, b: Banner) => a.sort_order - b.sort_order);
          setBanners(heroBanners);
        }
      } catch (err) {
        console.error("Failed to load banners:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBanners();
  }, []);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Touch handlers for swipe
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
    // No banners — render nothing, the existing hero section below will show
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div
      className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden bg-black select-none"
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
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            className="object-cover"
            priority={idx === 0}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30 z-10" />

          {/* Text Content */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-10 md:p-16 max-w-4xl">
            {banner.link_url ? (
              <Link href={banner.link_url} className="block group">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white drop-shadow-lg leading-tight group-hover:scale-[1.01] transition-transform">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="text-sm sm:text-base md:text-lg text-gray-200 mt-2 sm:mt-3 drop-shadow-md max-w-2xl font-medium">
                    {banner.subtitle}
                  </p>
                )}
                <span className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs sm:text-sm rounded-md transition-colors">
                  Shop Now
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            ) : (
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white drop-shadow-lg leading-tight">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="text-sm sm:text-base md:text-lg text-gray-200 mt-2 sm:mt-3 drop-shadow-md max-w-2xl font-medium">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all cursor-pointer"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all cursor-pointer"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Bottom Controls: Dots + Pause */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? "bg-amber-400 w-6"
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all cursor-pointer"
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
