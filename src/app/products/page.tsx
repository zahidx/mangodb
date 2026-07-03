"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { getCategories, getProducts } from "@/lib/supabase/queries";
import type { Category, Product } from "@/types/database";
import {
    ArrowRight,
    Heart,
    Loader2,
    MapPin,
    RefreshCw,
    Search,
    ShoppingBag,
    SlidersHorizontal,
    Sparkles,
    X
} from "lucide-react";
import Link from "next/link";
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

      {/* Background Orbs */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/10 dark:bg-accent/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 dark:bg-primary/5 blur-[150px] pointer-events-none z-0" />

      {/* Main Container */}
      <div className="w-full flex justify-center">
        <main className="grow max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-32 pb-24 relative z-10">
        
        {/* Header Block */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent-dark dark:text-accent-light tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            Rajshahi Orchard Fresh
          </div>
          <h1 className="font-serif-heading text-4xl sm:text-5xl font-bold text-hero-text tracking-tight max-w-2xl mx-auto leading-tight">
            Explore the Finest Mango Selection
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Taste the sweetness of pure, carbide-free premium mangoes handpicked and delivered right to your home in Bangladesh.
          </p>
        </div>

        {/* Search Bar Row */}
        <div className="mb-10 max-w-2xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="flex items-stretch">
            <div className="relative grow flex items-center bg-card border border-border rounded-l-2xl focus-within:border-primary/50 transition-all pl-5 pr-3 shadow-sm">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search Rajshahi Himsagar, Lengra, Amrapali..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-4 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm sm:text-base font-medium pl-3 pr-2 text-hero-text placeholder:text-muted-foreground/60"
              />
            </div>
            <button
              type="submit"
              className="px-7 sm:px-9 flex items-center justify-center rounded-r-2xl bg-primary hover:bg-primary-dark text-black font-bold text-sm shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* Toolbar & Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block lg:col-span-3 bg-card/60 backdrop-blur-md border border-border/80 rounded-3xl p-6 space-y-8 sticky top-24 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-bold text-hero-text text-base flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-accent-dark dark:text-accent-light" />
                Filters
              </h3>
              <button 
                onClick={handleResetFilters}
                className="text-xs text-muted-foreground hover:text-accent-dark dark:hover:text-accent-light font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground block">
                Category
              </label>
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedCategory === "all"
                      ? "bg-accent/10 text-accent-dark dark:text-accent-light border border-accent/20"
                      : "text-muted-foreground hover:bg-muted-bg border border-transparent"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all truncate ${
                      selectedCategory === cat.slug
                        ? "bg-accent/10 text-accent-dark dark:text-accent-light border border-accent/20"
                        : "text-muted-foreground hover:bg-muted-bg border border-transparent"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* District Filter */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground block">
                Origin District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-hero-text focus:outline-none focus:border-accent/50"
              >
                <option value="all">All Districts</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Chapai Nawabganj">Chapai Nawabganj</option>
                <option value="Rangpur">Rangpur</option>
              </select>
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                <span>Max Price</span>
                <span className="text-hero-text">৳{priceRange}</span>
              </div>
              <input
                type="range"
                min="300"
                max="3000"
                step="50"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent-dark dark:accent-accent-light"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                <span>৳300</span>
                <span>৳3,000</span>
              </div>
            </div>
          </aside>

          {/* Catalog Listing */}
          <section className="col-span-12 lg:col-span-9 space-y-6">
            
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-card/40 backdrop-blur-md border border-border/80 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground">
                Showing <strong className="text-hero-text font-bold">{products.length}</strong> items
              </span>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-xs font-semibold bg-card text-hero-text hover:border-accent/30 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                </button>

                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold text-hero-text focus:outline-none focus:border-accent/50 cursor-pointer"
                >
                  <option value="newest">Newest Harvest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>
            </div>

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
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((prod) => {
                  const isWished = wishlist.includes(prod.id);
                  const origin = (prod.metadata as any)?.origin_district || "Rajshahi";
                  const badge = (prod.metadata as any)?.badge;
                  return (
                    <div
                      key={prod.id}
                      className="group glass-card rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-border/60 hover:border-accent/20"
                    >
                      <div className="relative h-52 sm:h-56 w-full overflow-hidden shrink-0 bg-section-alt">
                        <Link href={`/products/${prod.slug}`} className="block w-full h-full cursor-pointer">
                          <img
                            src={prod.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80";
                            }}
                          />
                          {badge && (
                            <span className="absolute top-3 left-3 px-2.5 py-1 text-[9px] font-bold text-black bg-primary rounded-full uppercase tracking-wider shadow-sm">
                              {badge}
                            </span>
                          )}
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(prod.id);
                          }}
                          className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/5 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer z-20"
                        >
                          <Heart className={`w-4 h-4 ${isWished ? "fill-red-400 text-red-400" : ""}`} />
                        </button>
                      </div>

                      <div className="p-5 flex flex-col grow justify-between space-y-4">
                        <Link href={`/products/${prod.slug}`} className="space-y-2 block cursor-pointer group-hover:opacity-95">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent-dark dark:text-accent-light uppercase tracking-wider">
                            <MapPin className="w-3 h-3" />
                            {origin}
                          </div>
                          
                          <h3 className="font-serif-heading font-bold text-hero-text text-base line-clamp-1 group-hover:text-primary transition-colors">
                            {prod.name}
                          </h3>

                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {prod.description}
                          </p>
                        </Link>

                        <div className="flex items-center justify-between pt-3.5 border-t border-border">
                          <div>
                            {prod.sale_price ? (
                              <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground line-through">৳{prod.price}</span>
                                <span className="text-base font-black text-hero-text">৳{prod.sale_price}</span>
                              </div>
                            ) : (
                              <span className="text-base font-black text-hero-text">৳{prod.price}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/products/${prod.slug}`}
                              className="p-2 border border-border rounded-xl text-muted-foreground hover:text-hero-text hover:border-accent/20 hover:bg-accent/5 transition-all shadow-sm"
                              title="View Details"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => addToCart(prod, 1, "10kg")}
                              className="p-2 bg-primary hover:bg-primary-dark border border-primary/20 text-black rounded-xl transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
                              title="Add to Crate"
                            >
                              <ShoppingBag className="w-4 h-4 text-black" />
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

      {/* Mobile Drawer Filter Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setShowMobileFilters(false)}
          />
          {/* Drawer container */}
          <div className="relative w-full max-w-xs bg-background/95 backdrop-blur-xl border-l border-border h-full flex flex-col p-6 shadow-2xl z-10 animate-slide-in overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-bold text-hero-text text-base">Filter Options</h3>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="p-1 rounded-lg bg-card border border-border text-muted-foreground hover:text-hero-text cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground block">
                Category
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setShowMobileFilters(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedCategory === "all"
                      ? "bg-accent/10 text-accent-dark dark:text-accent-light border border-accent/20"
                      : "text-muted-foreground hover:bg-muted-bg border border-transparent"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      setShowMobileFilters(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all truncate ${
                      selectedCategory === cat.slug
                        ? "bg-accent/10 text-accent-dark dark:text-accent-light border border-accent/20"
                        : "text-muted-foreground hover:bg-muted-bg border border-transparent"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* District Filter */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground block">
                Origin District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setShowMobileFilters(false);
                }}
                className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-hero-text focus:outline-none focus:border-accent/50"
              >
                <option value="all">All Districts</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Chapai Nawabganj">Chapai Nawabganj</option>
                <option value="Rangpur">Rangpur</option>
              </select>
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                <span>Max Price</span>
                <span className="text-hero-text">৳{priceRange}</span>
              </div>
              <input
                type="range"
                min="300"
                max="3000"
                step="50"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent-dark dark:accent-accent-light"
              />
            </div>

            <button
              onClick={handleResetFilters}
              className="w-full py-3 mt-4 text-center rounded-xl bg-card border border-border text-xs font-semibold text-muted-foreground hover:text-hero-text hover:border-accent/30 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
