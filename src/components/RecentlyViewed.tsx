"use client";

import { useCart } from "@/context/CartContext";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ViewedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  image: string;
}

const STORAGE_KEY = "mangodb-recently-viewed";
const MAX_ITEMS = 12;

/** Call this when a user views a product detail page */
export function trackProductView(product: {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price?: number | null;
  images?: string[];
}) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const entry: ViewedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sale_price: product.sale_price ?? null,
      image: product.images?.[0] || "",
    };
    // Remove duplicate if exists
    const filtered = stored.filter((v: ViewedProduct) => v.id !== product.id);
    // Add to front
    filtered.unshift(entry);
    // Keep only max items
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch (_) {}
}

export default function RecentlyViewed() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<ViewedProduct[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setProducts(stored.slice(0, 6));
    } catch (_) {}
    try {
      const saved = localStorage.getItem("mangodb-wishlist");
      if (saved) setWishlist(JSON.parse(saved));
    } catch (_) {}
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 mt-14 relative z-20">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recently Viewed
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Products you have checked out recently</p>
        </div>
      </div>

      {/* Scrollable Row */}
      <div className="relative group/scroll">
        <div
          className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((prod) => {
            const isWished = wishlist.includes(prod.id);
            return (
              <div
                key={prod.id}
                className="snap-start shrink-0 w-[200px] sm:w-[220px] bg-white rounded-md border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 group/card"
              >
                {/* Image */}
                <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-gray-50">
                  <Link href={`/products/${prod.slug}`} className="block w-full h-full">
                    <Image
                      src={prod.image || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
                      alt={prod.name}
                      fill
                      sizes="220px"
                      className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                    />
                  </Link>
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col grow justify-between gap-1.5">
                  <Link href={`/products/${prod.slug}`} className="block">
                    <h3 className="font-sans font-bold text-gray-800 text-xs leading-tight line-clamp-2">
                      {prod.name}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[#4A7C59] font-bold text-sm">
                      ৳ {(prod.sale_price || prod.price).toLocaleString("en-BD")}
                    </span>
                    <button
                      onClick={() => addToCart(prod as any, 1, "10kg")}
                      className="p-1.5 rounded-md bg-[#527d62] hover:bg-[#436750] text-white transition-colors cursor-pointer active:scale-95"
                      title="Add to Cart"
                    >
                      <ShoppingBag className="w-3 h-3" />
                    </button>
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
