"use client";

import { FeaturedProductsSkeleton } from "@/components/skeletons";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { getFeaturedProducts } from "@/lib/supabase/queries";
import type { Product } from "@/types/database";
import { Heart, ShoppingBag, Star, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function FeaturedProducts() {
  const { addToCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { wishlist, isInWishlist, toggleWishlist } = useWishlist();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 320;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  // Fetch featured products on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchFeatured() {
      try {
        const res = await getFeaturedProducts(8);
        if (cancelled) return;
        if (res.data) {
          setProducts(res.data);
        }
      } catch (err) {
        console.error("Failed to load featured products:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchFeatured();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [products]);

  if (loading) {
    return <FeaturedProductsSkeleton />;
  }

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 mt-14 relative z-20">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            Featured Products
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Handpicked premium selections just for you</p>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View All
          <span className="text-lg leading-none">→</span>
        </Link>
      </div>

      {/* Scrollable Row */}
      <div className="relative group/scroll">
        {/* Left fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        )}

        {/* Scroll left button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer"
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((prod) => {
            const isWished = isInWishlist(prod.id);
            return (
              <div
                key={prod.id}
                className="snap-start shrink-0 w-[240px] sm:w-[260px] bg-white rounded-md border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 group/card"
              >
                {/* Image */}
                <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-gray-50">
                  <Link href={`/products/${prod.slug}`} className="block w-full h-full">
                    <Image
                      src={prod.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
                      alt={prod.name}
                      fill
                      sizes="260px"
                      className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <button
                    onClick={() => toggleWishlist(prod.id)}
                    className="absolute top-2 left-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-colors z-10 cursor-pointer"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWished ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3.5 flex flex-col grow justify-between gap-2">
                  <Link href={`/products/${prod.slug}`} className="block">
                    <h3 className="font-sans font-bold text-gray-800 text-sm leading-tight line-clamp-2">
                      {prod.name}
                    </h3>
                  </Link>

                  <div>
                    <div className="text-[#4A7C59] font-bold text-base">
                      {prod.sale_price ? (
                        <span>৳ {prod.sale_price.toLocaleString("en-BD")}</span>
                      ) : (
                        <span>৳ {prod.price.toLocaleString("en-BD")}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-2.5">
                      <button
                        onClick={() => addToCart(prod, 1, "10kg", false)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 border-2 border-[#527d62] text-[#527d62] hover:bg-[#527d62] hover:text-white rounded-md transition-all cursor-pointer active:scale-95 text-[10px] font-bold"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Add
                      </button>
                      <button
                        onClick={() => { addToCart(prod, 1, "10kg", false); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#527d62] hover:bg-[#436750] text-white rounded-md transition-all cursor-pointer active:scale-95 text-[10px] font-semibold"
                      >
                        <Zap className="w-3 h-3 fill-white" />
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        )}

        {/* Scroll right button */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer"
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
