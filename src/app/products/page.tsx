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
    ShoppingBag,
    Truck,
    Zap
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
    pageSize: 12,
    resetKey: `products-${selectedCategory}-${searchTerm}-${sortBy}`,
  });

  // Apply local filters (district, price) on accumulated products
  const products = React.useMemo(() => {
    let list = allProducts;
    if (selectedDistrict !== "all") {
      list = list.filter((p: any) =>
        p.metadata?.origin_district?.toLowerCase() === selectedDistrict.toLowerCase()
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
  const { wishlist, isInWishlist, toggleWishlist } = useWishlist();

  // Handle search submit (for the form)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput); // Immediate — no debounce
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-[#fbbf24] selection:text-black overflow-x-hidden">
      <Navbar />

      {/* Main Container */}
      <div className="w-full relative z-10">
        <main className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-12 pt-28 pb-24">
        
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Shop Mangoes" },
        ]} className="mb-6" />

        {/* Catalog Heading */}
        <div className="w-full mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-emerald-600">All Products</h1>
          <p className="text-[#3b574a] mt-2 text-sm">Browse our complete catalog of farm-fresh products</p>
          
          {/* Category Tabs */}
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-3 sm:p-5 w-full mt-6">
             <div 
               className="flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-start gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden pb-4 pt-2 w-full"
               style={{ WebkitOverflowScrolling: 'touch' }}
             >
               {/* All Products */}
               <button 
                 onClick={() => setSelectedCategory("all")}
                 className={`flex-shrink-0 w-24 min-h-[104px] sm:w-[120px] sm:min-h-[120px] flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-xl transition-all duration-300 border-2 bg-white py-2 cursor-pointer ${selectedCategory === "all" ? "border-emerald-600 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.3)] scale-105 z-10 relative" : "border-gray-200"}`}
               >
                 <div className="w-12 h-12 sm:w-[60px] sm:h-[60px] rounded-full overflow-hidden relative shadow-inner bg-emerald-50 flex items-center justify-center">
                    <Image src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=150&auto=format&fit=crop&q=80" alt="All Products" fill className="object-cover pointer-events-none" draggable={false} />
                 </div>
                 <span className="text-[11px] sm:text-sm font-bold text-gray-700 text-center leading-tight select-none">All Products</span>
               </button>

               {/* Dynamic Categories */}
               {categories.map((cat, i) => {
                 const getCategoryFallbackImage = (slug: string) => {
                   switch (slug) {
                     case 'mango': return "https://images.unsplash.com/photo-1553279768-865429fa0078?w=150&auto=format&fit=crop&q=80";
                     case 'dates': return "https://images.unsplash.com/photo-1528659138676-e91851e18dc9?w=150&auto=format&fit=crop&q=80";
                     case 'ghee': return "https://images.unsplash.com/photo-1589134712613-207d571f28b5?w=150&auto=format&fit=crop&q=80";
                     case 'honey': return "https://images.unsplash.com/photo-1587049352847-4d4b1f41b2a2?w=150&auto=format&fit=crop&q=80";
                     case 'nuts': return "https://images.unsplash.com/photo-1599598425947-33002621743a?w=150&auto=format&fit=crop&q=80";
                     case 'cold-drinks': return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&auto=format&fit=crop&q=80";
                     case 'combo-package': return "https://images.unsplash.com/photo-1598144073024-db080e7bbfa8?w=150&auto=format&fit=crop&q=80";
                     case 'pickle': return "https://images.unsplash.com/photo-1627042633145-b780d842ba45?w=150&auto=format&fit=crop&q=80";
                     default: return "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=150&auto=format&fit=crop&q=80";
                   }
                 };
                 return (
                   <button 
                      key={cat.id || i} 
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`flex-shrink-0 w-24 min-h-[104px] sm:w-[120px] sm:min-h-[120px] flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-xl transition-all duration-300 border-2 bg-white py-2 cursor-pointer ${selectedCategory === cat.slug ? "border-emerald-600 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.3)] scale-105 z-10 relative" : "border-gray-200"}`}
                   >
                     <div className="w-12 h-12 sm:w-[60px] sm:h-[60px] rounded-full overflow-hidden relative shadow-inner bg-emerald-50 flex items-center justify-center">
                        <Image src={cat.image_url || getCategoryFallbackImage(cat.slug)} alt={cat.name} fill className="object-cover pointer-events-none" draggable={false} />
                     </div>
                     <span className="text-[11px] sm:text-sm font-bold text-gray-700 text-center leading-tight select-none">{cat.name}</span>
                   </button>
                 );
               })}
             </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(""); setSearchTerm(""); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </form>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
          >
            Reset Filters
          </button>
        </div>

        {/* Products Grid */}
        <section className="w-full">

            {/* Loading / Empty States */}
            {loading ? (
              <ProductGridSkeleton count={10} />
            ) : productsError ? (
              <div className="h-96 flex flex-col items-center justify-center gap-4 bg-card/20 border border-red-500/20 rounded-3xl text-center p-8">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="font-serif-heading text-xl font-bold text-hero-text">Failed to load products</h3>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                  {productsError.includes("relation") || productsError.includes("does not exist")
                    ? "The database tables have not been set up yet. Please run the Supabase migrations."
                    : productsError.includes("configured")
                      ? "Supabase credentials are missing. Check your environment variables."
                      : productsError}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all cursor-pointer"
                  >
                    Retry
                  </button>
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-2.5 rounded-xl bg-accent/10 text-accent-dark dark:text-accent-light font-semibold border border-accent/20 hover:bg-accent/20 text-xs transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
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
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
                {products.map((prod) => {
                  const isWished = isInWishlist(prod.id);
                  const origin = (prod.metadata as any)?.origin_district || "Rajshahi";
                  const badge = (prod.metadata as any)?.badge;
                  return (
                    <div
                      key={prod.id}
                      className="group bg-white rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 border border-gray-100 hover:border-emerald-300 hover:shadow-[0_8px_30px_-8px_rgba(16,185,129,0.2)] hover:-translate-y-1"
                    >
                      <div className="relative h-36 sm:h-52 w-full overflow-hidden shrink-0 bg-gray-50">
                        <Link href={`/products/${prod.slug}`} className="block w-full h-full cursor-pointer">
                          <Image
                            src={prod.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
                            alt={prod.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                          <span className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-[10px] font-medium text-black bg-[#FFC107] rounded-sm shadow-sm z-10">
                            <Truck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">Free Delivery</span>
                            <span className="sm:hidden">Free</span>
                          </span>
                          {/* Quick View overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewProduct(prod); }}
                              className="px-5 py-2.5 bg-white text-gray-900 font-bold text-xs rounded-lg shadow-lg hover:bg-gray-100 transition-all cursor-pointer translate-y-4 group-hover:translate-y-0 duration-300"
                            >
                              Quick View
                            </button>
                          </div>
                        </Link>
                        {/* Wishlist */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(prod.id, prod.name);
                          }}
                          className={`absolute top-2 left-2 p-2 rounded-full backdrop-blur-sm border transition-all cursor-pointer z-20 shadow-sm ${
                            isWished
                              ? "bg-red-500 border-red-400 text-white"
                              : "bg-black/40 border-white/20 text-white hover:bg-black/60"
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isWished ? "fill-white" : ""}`} />
                        </button>
                        <label className="absolute bottom-2 left-2 z-20 flex items-center gap-1 px-1.5 py-1 sm:px-2 sm:py-1 rounded-md bg-black/40 backdrop-blur-sm border border-white/20 text-white cursor-pointer hover:bg-black/60 transition-colors text-[9px] sm:text-[10px] font-medium">
                          <input
                            type="checkbox"
                            checked={isInCompare(prod.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) addToCompare(prod);
                              else removeFromCompare(prod.id);
                            }}
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border-white/50 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 bg-white/20"
                          />
                          <span className="hidden sm:inline">Compare</span>
                        </label>
                      </div>

                      <div className="p-2.5 sm:p-4 flex flex-col grow justify-between space-y-2 sm:space-y-3">
                        <Link href={`/products/${prod.slug}`} className="space-y-1 block cursor-pointer">
                          <h3 className="font-sans font-bold text-gray-800 text-[12px] sm:text-[15px] leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">
                            {prod.name}
                          </h3>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 leading-relaxed pt-1">
                            <p className="line-clamp-1 sm:line-clamp-none">5/10/20 Kg Package Available.</p>
                            <p className="line-clamp-1 sm:line-clamp-none">Approximate Delivery Date Within 6-8 July</p>
                          </div>
                        </Link>

                        <div className="flex flex-col gap-2 sm:gap-3 pt-1">
                          <div className="text-emerald-700 font-bold text-[14px] sm:text-[17px] group-hover:scale-105 origin-left transition-transform">
                            {prod.sale_price ? (
                              <span>৳ {prod.sale_price} - ৳ {prod.sale_price * 3}</span>
                            ) : (
                              <span>৳ {prod.price} - ৳ {prod.price * 4}</span>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
                            <button
                              onClick={() => { addToCart(prod, 1, "10kg", false); router.push("/checkout"); }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded sm:rounded-lg transition-all cursor-pointer active:scale-[0.97] text-[10px] sm:text-xs font-bold shadow-sm hover:shadow-emerald-200"
                              title="Buy Now"
                            >
                              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white" />
                              <span className="whitespace-nowrap">Buy Now</span>
                            </button>
                            <button
                              onClick={() => addToCart(prod, 1, "10kg")}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 border border-emerald-600 sm:border-2 text-emerald-700 hover:bg-emerald-50 rounded sm:rounded-lg transition-all cursor-pointer active:scale-[0.97] text-[10px] sm:text-xs font-bold shadow-sm"
                              title="Add to Cart"
                            >
                              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="whitespace-nowrap">Cart</span>
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
              <div className="flex items-center justify-center gap-2 mt-10">
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                <span className="text-xs font-semibold text-[#475569]">Loading more products...</span>
              </div>
            )}

            {/* End of results */}
            {!hasMore && !loading && products.length > 0 && (
              <p className="text-center text-xs text-gray-400 mt-10 font-medium">
                You've reached the end of the catalog 🥭
              </p>
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
