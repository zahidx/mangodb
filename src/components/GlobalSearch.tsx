"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
      
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, sale_price, images")
        .ilike("name", `%${query}%`)
        .eq("is_active", true)
        .limit(5);

      if (data && !error) {
        setResults(data);
      } else {
        setResults([]);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div className="relative z-50 hidden lg:block" ref={dropdownRef}>
      <div className="relative flex items-center">
        <div className="absolute left-3 text-muted-foreground">
          {loading ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /> : <Search className="w-4 h-4" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder="Search mangoes..."
          className="w-64 pl-9 pr-8 py-2 rounded-xl bg-card border border-border text-sm font-semibold text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 text-muted-foreground hover:text-hero-text"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full mt-2 right-0 w-[320px] bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-none overflow-hidden font-sans">
          {results.length > 0 ? (
            <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                <Search className="w-3 h-3" /> Predictive Results
              </div>
              {results.map((product) => {
                const image = product.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=200&fit=crop";
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={() => { setIsOpen(false); setQuery(""); }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-500/10 transition-colors group cursor-pointer"
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-border">
                      <Image src={image} alt={product.name} fill sizes="40px" className="object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1 truncate">
                      <h4 className="text-xs font-extrabold text-hero-text group-hover:text-emerald-600 truncate transition-colors">{product.name}</h4>
                      <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">৳{product.sale_price || product.price}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : !loading ? (
            <div className="p-6 text-center text-xs font-bold text-muted-foreground">
              No mangoes found matching "{query}"
            </div>
          ) : (
             <div className="p-6 text-center text-xs font-bold text-muted-foreground flex items-center justify-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> Searching orchards...
             </div>
          )}
        </div>
      )}
    </div>
  );
}
