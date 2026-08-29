"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import QuickViewModal from "@/components/QuickViewModal";
import { ProductGridSkeleton } from "@/components/skeletons";
import { useCart } from "@/context/CartContext";
import { useCompare } from "@/context/CompareContext";
import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";
import { useWishlist } from "@/hooks/useWishlist";
import { getCategories } from "@/lib/supabase/queries";
import type { Category } from "@/types/database";
import {
  Heart,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  Truck,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);

  // Search & Filter state
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat) setSelectedCategory(cat);
    }
  }, []);

  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<number>(3000);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "name">("newest");

  // Debounce search — wait 300ms after user stops typing
  useEffect(() => {
    if (searchInput === searchTerm) return;
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchTerm]);

  // Infinite scroll hook
  const {
    products: allProducts,
    loading,
    loadingMore,
    hasMore,
    error: productsError,
    sentinelRef,
  } = useInfiniteProducts({
    categorySlug: selectedCategory === "all" ? undefined : selectedCategory,
    search: searchTerm || undefined,
    sortBy,
    pageSize: 15,
    resetKey: `products-${selectedCategory}-${searchTerm}-${sortBy}`,
  });

  // Apply local filters (district, price) on accumulated products
  const products = React.useMemo(() => {
    let list = allProducts;
    if (selectedDistrict !== "all") {
      list = list.filter(
        (p: any) => p.metadata?.origin_district?.toLowerCase() === selectedDistrict.toLowerCase()
      );
    }
    list = list.filter((p: any) => (p.sale_price || p.price) <= priceRange);
    return list;
  }, [allProducts, selectedDistrict, priceRange]);

  // Fetch categories once
  useEffect(() => {
    getCategories().then((res) => {
      if (res.data) setCategories(res.data);
    });
  }, []);

  // Quick View state
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);

  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { wishlist, toggleWishlist } = useWishlist();

  // Handle search submit (for the form)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedDistrict("all");
    setPriceRange(3000);
    setSortBy("newest");
    toast.success("Filters reset");
  };

  const getCategoryFallbackImage = (slug: string) => {
    switch (slug) {
      case "mango":
        return "https://images.unsplash.com/photo-1553279768-865429fa0078?w=150&auto=format&fit=crop&q=80";
      case "dates":
        return "https://images.unsplash.com/photo-1528659138676-e91851e18dc9?w=150&auto=format&fit=crop&q=80";
      case "ghee":
        return "https://images.unsplash.com/photo-1589134712613-207d571f28b5?w=150&auto=format&fit=crop&q=80";
      case "honey":
        return "https://images.unsplash.com/photo-1587049352847-4d4b1f41b2a2?w=150&auto=format&fit=crop&q=80";
      case "nuts":
        return "https://images.unsplash.com/photo-1599598425947-33002621743a?w=150&auto=format&fit=crop&q=80";
      case "cold-drinks":
        return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&auto=format&fit=crop&q=80";
      case "combo-package":
        return "https://images.unsplash.com/photo-1598144073024-db080e7bbfa8?w=150&auto=format&fit=crop&q=80";
      case "pickle":
        return "https://images.unsplash.com/photo-1627042633145-b780d842ba45?w=150&auto=format&fit=crop&q=80";
      default:
        return "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=150&auto=format&fit=crop&q=80";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden transition-colors duration-200">
      <Navbar />

      {/* Main Container */}
      <div className="w-full relative z-10 flex-1">
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-28 pb-24">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Catalog" }]}
            className="mb-8"
          />

          {/* Catalog Heading */}
          <div className="w-full mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-border">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">
                  Farm Fresh Collection
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-hero-text mt-0.5">
                  All Products
                </h1>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Showing {products.length} verified products
              </p>
            </div>

            {/* Category Tabs Container */}
            <div className="bg-card rounded-3xl border border-border p-3 sm:p-4 w-full mt-6 shadow-xs">
              <div
                className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 w-full scrollbar-hide"
                style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
              >
                {/* All Products Button */}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 border cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-muted-bg text-hero-text border-border hover:border-border-strong hover:bg-card"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl overflow-hidden relative bg-emerald-500/10 shrink-0">
                    <Image
                      src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=120&auto=format&fit=crop&q=80"
                      alt="All Products"
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap">
                    All Products
                  </span>
                </button>

                {/* Dynamic Category Buttons */}
                {categories.map((cat, i) => {
                  const isActive = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.id || i}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 border cursor-pointer ${
                        isActive
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-muted-bg text-hero-text border-border hover:border-border-strong hover:bg-card"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl overflow-hidden relative bg-emerald-500/10 shrink-0">
                        <Image
                          src={cat.image_url || getCategoryFallbackImage(cat.slug)}
                          alt={cat.name}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products by name..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-card text-xs font-medium text-hero-text placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearchTerm("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-hero-text cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2.5 text-xs font-semibold text-hero-text bg-card border border-border rounded-xl hover:bg-muted-bg hover:border-border-strong transition-colors cursor-pointer shrink-0"
            >
              Reset Filters
            </button>
          </div>

          {/* Products Grid */}
          <section className="w-full">
            {/* Loading Skeleton */}
            {loading && products.length === 0 && (
              <ProductGridSkeleton count={10} />
            )}

            {/* Error State */}
            {productsError && !loading && (
              <div className="py-16 text-center bg-card rounded-3xl border border-border p-8 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                  <X className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="font-bold text-hero-text text-base">Could not load catalog</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {productsError.includes("relation") || productsError.includes("exist")
                    ? "Database setup in progress. Please retry in a moment."
                    : productsError}
                </p>
                <div className="flex gap-3 justify-center mt-5">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Reload Page
                  </button>
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 bg-card border border-border hover:bg-muted-bg text-hero-text text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && !productsError && (
              <div className="py-20 text-center bg-card rounded-3xl border border-border p-8">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h3 className="font-bold text-hero-text text-sm">No products found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search term or select another category.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Products Grid */}
            {!loading && products.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {products.map((prod) => {
                  const isWished = wishlist.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      className="group bg-card rounded-2xl border border-border hover:border-emerald-500/30 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300"
                    >
                      {/* Image Container */}
                      <div className="relative h-44 sm:h-52 w-full overflow-hidden shrink-0 bg-muted-bg">
                        <Link href={`/products/${prod.slug}`} className="block w-full h-full">
                          <Image
                            src={
                              prod.images?.[0] ||
                              "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"
                            }
                            alt={prod.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />

                          {/* Delivery Badge */}
                          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-semibold text-emerald-950 dark:text-emerald-100 bg-emerald-400/90 dark:bg-emerald-600/90 backdrop-blur-md rounded-full shadow-sm z-10">
                            <Truck className="w-2.5 h-2.5" />
                            <span>Free Delivery</span>
                          </span>

                          {/* Quick View Overlay */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setQuickViewProduct(prod);
                              }}
                              className="px-3.5 py-1.5 bg-white text-neutral-900 font-semibold text-xs rounded-lg shadow-md hover:bg-neutral-100 transition-all cursor-pointer active:scale-95"
                            >
                              Quick View
                            </button>
                          </div>
                        </Link>

                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(prod.id);
                          }}
                          className="absolute top-2.5 left-2.5 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 transition-all z-20 cursor-pointer active:scale-90"
                          aria-label="Wishlist"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-colors ${
                              isWished ? "fill-rose-500 text-rose-500" : ""
                            }`}
                          />
                        </button>

                        {/* Compare Checkbox */}
                        <label className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-white/15 text-white cursor-pointer hover:bg-black/70 transition-colors text-[9px] font-mono">
                          <input
                            type="checkbox"
                            checked={isInCompare(prod.id)}
                            onChange={(e) => {
                              if (e.target.checked) addToCompare(prod);
                              else removeFromCompare(prod.id);
                            }}
                            className="w-2.5 h-2.5 rounded border-white/40 text-emerald-500 focus:ring-0 bg-transparent"
                          />
                          <span className="hidden sm:inline">Compare</span>
                        </label>
                      </div>

                      {/* Content */}
                      <div className="p-3.5 sm:p-4 flex flex-col grow justify-between gap-2.5">
                        <div className="space-y-0.5">
                          <Link href={`/products/${prod.slug}`} className="block group-hover:opacity-90">
                            <h3 className="font-bold text-hero-text text-xs sm:text-sm leading-snug line-clamp-2">
                              {prod.name}
                            </h3>
                          </Link>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 font-normal">
                            5/10kg Packages · Farm Certified
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/50 space-y-2.5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm sm:text-base font-extrabold text-hero-text">
                              ৳{prod.sale_price || prod.price}
                            </span>
                            {prod.sale_price && prod.sale_price < prod.price && (
                              <span className="text-[11px] text-muted-foreground line-through">
                                ৳{prod.price}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                              / 10kg
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                await addToCart(prod, 1, "10kg", false);
                                router.push("/checkout");
                              }}
                              className="flex items-center justify-center gap-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer active:scale-95 text-[11px] font-semibold shadow-xs"
                              title="Instant Checkout"
                            >
                              <Zap className="w-3 h-3 fill-white" />
                              <span>Buy</span>
                            </button>
                            <button
                              onClick={() => addToCart(prod, 1, "10kg")}
                              className="flex items-center justify-center gap-1 py-2 border border-border bg-card hover:bg-muted-bg text-hero-text rounded-xl transition-all cursor-pointer active:scale-95 text-[11px] font-semibold"
                              title="Add to Basket"
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
            )}

            {/* Loading More Spinner */}
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 mt-12 py-4">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span className="text-xs font-medium text-muted-foreground font-mono">
                  Fetching more varieties...
                </span>
              </div>
            )}

            {/* End of results */}
            {!hasMore && !loading && products.length > 0 && (
              <div className="text-center mt-12 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground font-mono">
                  You have reached the end of the catalog · 🥭
                </p>
              </div>
            )}

            {/* Sentinel element for IntersectionObserver */}
            <div ref={sentinelRef} className="h-4" />
          </section>
        </main>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
        />
      )}

      <Footer />
    </div>
  );
}
