"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { getCategories, getProducts } from "@/lib/supabase/queries";
import type { Category, Product } from "@/types/database";
import {
    Citrus,
    CupSoda,
    Droplet,
    Heart,
    Hexagon,
    Leaf,
    Loader2,
    Nut,
    Palmtree,
    ShoppingBag,
    Truck,
    Zap
} from "lucide-react";
import Image from "next/image";
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
          limit: 100
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

      {/* Main Container */}
      <div className="w-full relative z-10">
        <main className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-12 pt-28 pb-24">
        
        {/* Catalog Heading */}
        <div className="w-full mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-emerald-600">All Products</h1>
          <p className="text-[#3b574a] mt-2 text-sm">Browse our complete catalog of farm-fresh products</p>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button 
              onClick={() => setSelectedCategory("all")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-bold shadow-sm transition-all ${selectedCategory === "all" ? "bg-emerald-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"}`}
            >
               <ShoppingBag className="w-4 h-4" />
               All Products
            </button>
            {categories.map((cat, i) => {
               const getCategoryIcon = (slug: string) => {
                 switch (slug) {
                   case 'mango': return <Citrus className="w-4 h-4" />;
                   case 'dates': return <Palmtree className="w-4 h-4" />;
                   case 'ghee': return <Droplet className="w-4 h-4" />;
                   case 'honey': return <Hexagon className="w-4 h-4" />;
                   case 'nuts': return <Nut className="w-4 h-4" />;
                   case 'cold-drinks': return <CupSoda className="w-4 h-4" />;
                   default: return <Leaf className="w-4 h-4" />;
                 }
               };
               return (
                 <button 
                    key={cat.id || i} 
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-bold shadow-sm transition-all ${selectedCategory === cat.slug ? "bg-emerald-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"}`}
                 >
                    {getCategoryIcon(cat.slug)}
                    {cat.name}
                 </button>
               );
            })}
          </div>
        </div>

        {/* Products Grid */}
        <section className="w-full">

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
                            src={prod.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
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
      </main>
      </div>

      <Footer />
    </div>
  );
}
