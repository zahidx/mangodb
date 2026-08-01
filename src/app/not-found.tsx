"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Home, ShoppingBag, Truck, Compass } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-[#fbbf24] selection:text-black overflow-x-hidden">
      <Navbar />

      {/* Ambient background glows */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[140px] pointer-events-none" />

      <main className="grow flex items-center justify-center py-28 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-xl w-full text-center space-y-8 animate-fade-in bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl p-8 sm:p-12 shadow-2xl">
          
          {/* Branded Icon Badge */}
          <div className="flex justify-center">
            <div className="w-28 h-28 rounded-3xl bg-amber-400/10 dark:bg-amber-400/15 flex items-center justify-center relative shadow-lg border border-amber-400/30 group">
              <Compass className="w-14 h-14 text-amber-500 transition-transform duration-500 group-hover:rotate-45" />
              <div className="absolute -bottom-3 -right-3 text-4xl animate-bounce">
                🥭
              </div>
            </div>
          </div>
          
          {/* Header & Message */}
          <div className="space-y-3 font-sans">
            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest">
              404 — Page Not Found
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif-heading font-black text-hero-text leading-tight">
              Oops! This Harvest is Missing
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              The page you're looking for might have been moved, renamed, or this variety is out of season. Search our orchard catalog below!
            </p>
          </div>

          {/* Product Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-md mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Himsagar, Lengra, Amrapali..."
              className="w-full pl-11 pr-24 py-3 rounded-2xl bg-muted-bg border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-muted-foreground"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 font-sans">
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md hover:-translate-y-0.5"
            >
              <Home className="w-4 h-4" />
              Homepage
            </Link>
            <Link 
              href="/products"
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-muted-bg border border-border/80 hover:border-emerald-500/40 text-foreground font-bold text-xs transition-all hover:-translate-y-0.5"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Shop Mangoes
            </Link>
            <Link 
              href="/track"
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-muted-bg border border-border/80 hover:border-amber-500/40 text-foreground font-bold text-xs transition-all hover:-translate-y-0.5"
            >
              <Truck className="w-4 h-4 text-amber-500" />
              Track Order
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
