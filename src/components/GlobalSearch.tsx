"use client";

import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient() as any;

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setActiveIndex(-1);
      
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, sale_price, images, category:categories(name)")
        .ilike("name", `%${query}%`)
        .eq("is_active", true)
        .limit(6);

      if (data && !error) {
        setResults(data);
      } else {
        setResults([]);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(fetchResults, 250);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          const product = results[activeIndex];
          closeSearch();
          router.push(`/products/${product.slug}`);
        } else if (query.trim().length >= 2) {
          closeSearch();
          router.push(`/products?search=${encodeURIComponent(query.trim())}`);
        }
        break;
      case "Escape":
        closeSearch();
        break;
    }
  }, [isOpen, results, activeIndex, query, router]);

  const closeSearch = () => {
    setIsOpen(false);
    setMobileOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
  };

  // Focus input when mobile opens
  useEffect(() => {
    if (mobileOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [mobileOpen]);

  const searchInput = (mobile: boolean = false) => (
    <div className="relative flex items-center">
      <div className="absolute left-3 text-muted-foreground pointer-events-none">
        {loading ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /> : <Search className="w-4 h-4" />}
      </div>
      <input
        ref={mobile ? inputRef : undefined}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search mangoes..."
        className={`${
          mobile ? "w-full pl-10 pr-10 py-3 text-base" : "w-56 lg:w-64 pl-9 pr-8 py-2 text-sm"
        } rounded-xl bg-card border border-border font-semibold text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm`}
      />
      {query && (
        <button
          onClick={() => {
            setQuery("");
            setResults([]);
            setActiveIndex(-1);
          }}
          className="absolute right-3 text-muted-foreground hover:text-hero-text transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Search */}
      <div className="relative z-50 hidden lg:block" ref={dropdownRef}>
        {searchInput(false)}

        {/* Dropdown Results */}
        {isOpen && query.trim().length >= 2 && (
          <div className="absolute top-full mt-2 right-0 w-[360px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden font-sans">
            {loading ? (
              <div className="p-6 text-center text-xs font-bold text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> Searching orchards...
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto p-2 space-y-0.5">
                <div className="px-3 py-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                  <Search className="w-3 h-3" /> Products ({results.length})
                </div>
                {results.map((product, idx) => {
                  const image = product.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=200&fit=crop";
                  const catName = product.category?.name;
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={closeSearch}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors group cursor-pointer ${
                        idx === activeIndex
                          ? "bg-emerald-500/15 ring-1 ring-emerald-500/30"
                          : "hover:bg-emerald-500/10"
                      }`}
                    >
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-border shadow-sm">
                        <Image src={image} alt={product.name} fill sizes="44px" className="object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-extrabold text-hero-text group-hover:text-emerald-600 truncate transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                            ৳{product.sale_price || product.price}
                          </p>
                          {catName && (
                            <span className="text-[9px] font-semibold text-muted-foreground bg-muted-bg/50 px-1.5 py-0.5 rounded truncate">
                              {catName}
                            </span>
                          )}
                        </div>
                      </div>
                      {idx === activeIndex && (
                        <span className="text-[10px] text-emerald-600 font-bold shrink-0 animate-pulse">↵</span>
                      )}
                    </Link>
                  );
                })}

                {/* View All Results */}
                <Link
                  href={`/products?search=${encodeURIComponent(query.trim())}`}
                  onClick={closeSearch}
                  className="flex items-center justify-center gap-1.5 mt-1 mx-1 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold transition-colors border border-emerald-500/20"
                >
                  View all results
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs font-bold text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Try different keywords or browse categories
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Search Trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-emerald-500 transition-all cursor-pointer"
        aria-label="Open search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Mobile Search Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSearch} />
          <div className="relative bg-card border-b border-border p-4 pt-14 shadow-lg" ref={dropdownRef}>
            <div className="max-w-lg mx-auto">
              <div className="flex items-center gap-2">
                <div className="flex-1">{searchInput(true)}</div>
                <button
                  onClick={closeSearch}
                  className="shrink-0 px-3 py-2.5 text-xs font-bold text-muted-foreground hover:text-hero-text transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Mobile Results */}
              {isOpen && query.trim().length >= 2 && (
                <div className="mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                  {loading ? (
                    <div className="p-6 text-center text-xs font-bold text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> Searching...
                    </div>
                  ) : results.length > 0 ? (
                    <div className="p-2 space-y-0.5">
                      {results.map((product, idx) => {
                        const image = product.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=200&fit=crop";
                        return (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            onClick={closeSearch}
                            className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                              idx === activeIndex ? "bg-emerald-500/15" : "hover:bg-emerald-500/10"
                            }`}
                          >
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border">
                              <Image src={image} alt={product.name} fill sizes="48px" className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-hero-text truncate">{product.name}</h4>
                              <p className="text-xs font-black text-emerald-600">৳{product.sale_price || product.price}</p>
                            </div>
                          </Link>
                        );
                      })}
                      <Link
                        href={`/products?search=${encodeURIComponent(query.trim())}`}
                        onClick={closeSearch}
                        className="flex items-center justify-center gap-1.5 mt-1 mx-1 py-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm font-extrabold transition-colors"
                      >
                        View all results
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-sm font-bold text-muted-foreground">No results found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
