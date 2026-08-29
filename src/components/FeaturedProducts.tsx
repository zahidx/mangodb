"use client";

import { FeaturedProductsSkeleton } from "@/components/skeletons";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { getFeaturedProducts } from "@/lib/supabase/queries";
import type { Product } from "@/types/database";
import { ArrowRight, ChevronLeft, ChevronRight, Heart, ShoppingBag, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function FeaturedProducts() {
  const router = useRouter();
  const { addToCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isInWishlist, toggleWishlist } = useWishlist();
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
    const amount = 340;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  // Fetch featured products on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchFeatured() {
      try {
        const res = await getFeaturedProducts(8);
        if (cancelled) return;
        if (res.data && res.data.length > 0) {
          setProducts(res.data);
        }
      } catch (err) {
        console.error("Failed to load featured products:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchFeatured();
    return () => {
      cancelled = true;
    };
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 relative z-20">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Curated Harvest Selections
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-hero-text">
            Featured Fresh Harvest
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll Controls */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full border border-border bg-card hover:bg-muted-bg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-hero-text transition-all active:scale-95 cursor-pointer"
              aria-label="Previous items"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full border border-border bg-card hover:bg-muted-bg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-hero-text transition-all active:scale-95 cursor-pointer"
              aria-label="Next items"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-hero-text hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <span>Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Scrollable Row */}
      <div className="relative group/scroll">
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((prod) => {
            const isWished = isInWishlist(prod.id);
            return (
              <div
                key={prod.id}
                className="snap-start shrink-0 w-[240px] sm:w-[260px] bg-card rounded-2xl border border-border overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300 group/card"
              >
                {/* Image Card */}
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-muted-bg">
                  <Link href={`/products/${prod.slug}`} className="block w-full h-full">
                    <Image
                      src={
                        prod.images?.[0] ||
                        "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"
                      }
                      alt={prod.name}
                      fill
                      sizes="260px"
                      className="object-cover group-hover/card:scale-105 transition-transform duration-700 ease-out"
                    />
                  </Link>

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[9px] font-mono font-medium uppercase tracking-wider">
                      Tree Ripened
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={() => toggleWishlist(prod.id)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white hover:bg-black/70 transition-all z-10 cursor-pointer active:scale-90"
                    aria-label="Add to wishlist"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
                        isWished ? "fill-rose-500 text-rose-500 stroke-rose-500" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Details */}
                <div className="p-3.5 sm:p-4 flex flex-col grow justify-between gap-2.5">
                  <div>
                    <Link href={`/products/${prod.slug}`} className="block group-hover/card:opacity-90">
                      <h3 className="font-bold text-hero-text text-sm leading-snug line-clamp-1">
                        {prod.name}
                      </h3>
                    </Link>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      Rajshahi Certified · 5/10kg Packages
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60">
                    <div className="flex items-baseline gap-1.5 mb-2.5">
                      <span className="text-base font-extrabold text-hero-text">
                        ৳{prod.sale_price ? prod.sale_price.toLocaleString("en-BD") : prod.price.toLocaleString("en-BD")}
                      </span>
                      {prod.sale_price && prod.sale_price < prod.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          ৳{prod.price.toLocaleString("en-BD")}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground font-mono ml-auto">/ 10kg</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={async () => {
                          await addToCart(prod, 1, "10kg", false);
                          router.push("/checkout");
                        }}
                        className="flex items-center justify-center gap-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer active:scale-95 text-xs font-semibold shadow-xs"
                      >
                        <Zap className="w-3 h-3 fill-white" />
                        <span>Buy Now</span>
                      </button>
                      <button
                        onClick={() => addToCart(prod, 1, "10kg", false)}
                        className="flex items-center justify-center gap-1 py-2 border border-border bg-card hover:bg-muted-bg text-hero-text rounded-xl transition-all cursor-pointer active:scale-95 text-xs font-semibold"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
