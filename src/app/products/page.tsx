"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { getCategories, getProducts } from "@/lib/supabase/queries";
import type { Category, Product } from "@/types/database";
import {
    ArrowRight,
    CheckCircle2,
    Heart,
    Loader2,
    MapPin,
    RefreshCw,
    Search,
    ShieldCheck,
    ShoppingBag,
    SlidersHorizontal,
    Sparkles,
    TreeDeciduous,
    Truck,
    Zap,
    X
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<number>(3000);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "name">("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const savedWish = localStorage.getItem("mangodb-wishlist");
    if (savedWish) {
      try { setWishlist(JSON.parse(savedWish)); } catch (e) {}
    }
  }, []);

  const toggleWishlist = (productId: string) => {
    let nextWish = [...wishlist];
    if (wishlist.includes(productId)) {
      nextWish = nextWish.filter(id => id !== productId);
      toast.success("Removed from wishlist");
    } else {
      nextWish.push(productId);
      toast.success("Added to wishlist");
    }
    setWishlist(nextWish);
    localStorage.setItem("mangodb-wishlist", JSON.stringify(nextWish));
  };

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        getProducts({
          categorySlug: selectedCategory === "all" ? undefined : selectedCategory,
          search: searchTerm ? searchTerm : undefined,
          sortBy,
        }),
        getCategories(),
      ]);

      if (prodRes.data) {
        // Filter by origin_district locally if not 'all'
        let list = prodRes.data;
        if (selectedDistrict !== "all") {
          list = list.filter((p: any) => 
            p.metadata?.origin_district?.toLowerCase() === selectedDistrict.toLowerCase()
          );
        }
        // Filter by price locally
        list = list.filter((p: any) => (p.sale_price || p.price) <= priceRange);

        setProducts(list);
      }
      if (catRes.data) {
        setCategories(catRes.data);
      }
    } catch (error) {
      toast.error("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, selectedDistrict, priceRange, sortBy]);

  // Handle manual search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedDistrict("all");
    setPriceRange(3000);
    setSortBy("newest");
    toast.success("Filters reset");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-[#fbbf24] selection:text-black overflow-x-hidden">
      <Navbar />

      {/* Luxury White/Mint Background */}
      <div className="absolute top-0 left-0 w-full h-[950px] bg-[radial-gradient(ellipse_at_top,#f8fcfb_0%,#f0f7ea_40%,#fdf5df_100%)] pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-[#9ecfc5] opacity-20 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute top-[30%] -right-[10%] w-[700px] h-[700px] bg-[#dcb65b] opacity-15 blur-[150px] rounded-full mix-blend-multiply" />
      </div>

      {/* Main Container */}
      <div className="w-full relative z-10">
        <main className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-12 pt-32 pb-24">
        
        {/* Advanced Luxury Hero Section */}
        <div className="w-full flex flex-col items-center justify-center pt-6 pb-20">
          <div className="flex flex-col items-center text-center max-w-4xl w-full mx-auto space-y-5">
            
            {/* Ornate Premium Badge */}
            <div className="relative group cursor-pointer animate-fade-in-up mt-4">
              <div className="p-[1.5px] rounded-full bg-gradient-to-r from-[#C6A258]/0 via-[#C6A258]/80 to-[#C6A258]/0 shadow-[0_2px_15px_rgba(198,162,88,0.3)]">
                <div className="relative inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#133824] border border-[#C6A258]/30 text-[10px] sm:text-xs font-black text-[#E8D099] tracking-[0.2em] uppercase">
                  <TreeDeciduous className="w-3.5 h-3.5 text-[#C6A258]" />
                  Rajshahi Orchard Fresh
                </div>
              </div>
            </div>
            
            {/* Luxury Heading */}
            <h1 className="font-serif-heading text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-black tracking-tight leading-[1.0] text-center w-full animate-fade-in-up pb-[20px]" style={{ animationDelay: "100ms" }}>
              <span className="text-[#0D2319]">Explore the Finest</span> <br />
              <span className="text-[#2B936C]">Mango Selection</span>
            </h1>

            {/* Glassmorphic Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl mx-auto mt-10 group z-20 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#C6A258]/40 via-[#F3E1B6]/60 to-[#C6A258]/40 rounded-[2.5rem] blur-md opacity-60 transition duration-500" />
              <div className="relative flex items-center bg-white/95 backdrop-blur-xl border-2 border-[#C6A258]/60 rounded-[2rem] p-1 shadow-[0_15px_30px_rgba(13,35,25,0.15)] transition-all duration-300">
                <div className="pl-5 pr-2 flex items-center justify-center">
                  <Search className="w-5 h-5 text-[#A08855]" strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  placeholder="e.g., Himsagar, Lengra, Amrapali..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-3.5 bg-transparent border-0 focus:ring-0 focus:outline-none text-base sm:text-lg font-bold text-[#0D2319] placeholder:text-[#133824]/50"
                />
                <button
                  type="submit"
                  className="px-8 py-3.5 flex items-center justify-center rounded-[1.6rem] bg-gradient-to-b from-[#C6A258] to-[#997328] hover:from-[#dcb65b] hover:to-[#B3852C] text-[#0A2214] font-black text-base transition-transform active:scale-95 shadow-inner shrink-0 cursor-pointer"
                >
                  Explore
                </button>
              </div>
            </form>

            {/* Premium Trust Badges Row */}
            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 pt-10 text-xs sm:text-sm font-extrabold text-[#0D2319] animate-fade-in-up" style={{ animationDelay: "400ms" }}>
              <span className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#F3E1B6] via-[#C6A258] to-[#997328] shadow-[0_3px_10px_rgba(198,162,88,0.4)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0A2214]" />
                </div>
                100% Formalin Free
              </span>
              <span className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#F3E1B6] via-[#C6A258] to-[#997328] shadow-[0_3px_10px_rgba(198,162,88,0.4)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0A2214]" />
                </div>
                Garden Fresh Delivery
              </span>
              <span className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#F3E1B6] via-[#C6A258] to-[#997328] shadow-[0_3px_10px_rgba(198,162,88,0.4)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0A2214]" />
                </div>
                Premium Quality
              </span>
            </div>

          </div>
        </div>

        {/* Toolbar & Grid */}
        <div className="w-full">
          
          {/* Catalog Listing */}
          <section className="w-full space-y-6">


            {/* Loading / Empty States */}
            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center gap-3 bg-card/20 border border-border/60 rounded-3xl">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-sm text-muted-foreground font-bold font-sans">Harvesting products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center gap-4 bg-card/20 border border-border/60 rounded-3xl text-center p-8">
                <span className="text-5xl">🥭</span>
                <h3 className="font-serif-heading text-xl font-bold text-hero-text">No mangoes match your filters</h3>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                  Try adjusting your search query, selecting a different district, or resetting the filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 rounded-xl bg-accent/10 text-accent-dark dark:text-accent-light font-semibold border border-accent/20 hover:bg-accent/20 text-xs transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              /* Products Grid */
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((prod) => {
                  const isWished = wishlist.includes(prod.id);
                  const origin = (prod.metadata as any)?.origin_district || "Rajshahi";
                  const badge = (prod.metadata as any)?.badge;
                  return (
                    <div
                      key={prod.id}
                      className="group bg-white rounded-md overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-gray-100"
                    >
                      <div className="relative h-48 sm:h-52 w-full overflow-hidden shrink-0 bg-gray-50">
                        <Link href={`/products/${prod.slug}`} className="block w-full h-full cursor-pointer">
                          <Image
                            src={prod.images?.[0] && !prod.images[0].includes("1552474030-b3a5b5f04e2e") ? prod.images[0] : "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
                            alt={prod.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-black bg-[#FFC107] rounded-sm shadow-sm z-10">
                            <Truck className="w-3 h-3" />
                            Free Delivery
                          </span>
                        </Link>
                        {/* Wishlist moved to top-left to accommodate the Free Delivery badge on the right */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(prod.id);
                          }}
                          className="absolute top-2 left-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-colors cursor-pointer z-20 shadow-sm"
                        >
                          <Heart className={`w-4 h-4 ${isWished ? "fill-red-500 text-red-500 border-none" : ""}`} />
                        </button>
                      </div>

                      <div className="p-4 flex flex-col grow justify-between space-y-3">
                        <Link href={`/products/${prod.slug}`} className="space-y-1 block cursor-pointer group-hover:opacity-95">
                          <h3 className="font-sans font-bold text-gray-800 text-[15px] leading-tight line-clamp-2">
                            {prod.name}
                          </h3>
                          <div className="text-[11px] text-gray-500 leading-relaxed pt-1">
                            <p>5/10/20 Kg Package Available.</p>
                            <p>Approximate Delivery Date Within 6-8 July</p>
                          </div>
                        </Link>

                        <div className="flex flex-col gap-3 pt-1">
                          <div className="text-[#4A7C59] font-bold text-[17px]">
                            {prod.sale_price ? (
                              <span>৳ {prod.sale_price} - ৳ {prod.sale_price * 3}</span>
                            ) : (
                              <span>৳ {prod.price} - ৳ {prod.price * 4}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => addToCart(prod, 1, "10kg")}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#527d62] hover:bg-[#436750] text-white rounded-md transition-colors cursor-pointer active:scale-95 text-[11px] sm:text-xs font-semibold shadow-sm"
                              title="Buy Now"
                            >
                              <Zap className="w-3.5 h-3.5 fill-white" />
                              Buy Now
                            </button>
                            <button
                              onClick={() => addToCart(prod, 1, "10kg")}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 border-2 border-[#527d62] text-[#527d62] hover:bg-[#527d62]/10 rounded-md transition-colors cursor-pointer active:scale-95 text-[11px] sm:text-xs font-bold shadow-sm"
                              title="Add to Cart"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      </div>

      <Footer />
    </div>
  );
}
