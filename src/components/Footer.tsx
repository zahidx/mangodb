"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Mail, ArrowRight, ShieldCheck, Leaf, Truck } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert("Thanks for subscribing to MangoDB!");
      setEmail("");
    }
  };

  return (
    <footer className="bg-card/80 backdrop-blur-xl border-t border-border pt-20 pb-10 relative z-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: Features / Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-16 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-extrabold text-hero-text text-sm">100% Organic</h4>
              <p className="text-xs text-muted-foreground mt-1">Farm-fresh, naturally ripened.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h4 className="font-extrabold text-hero-text text-sm">Express Delivery</h4>
              <p className="text-xs text-muted-foreground mt-1">Direct from Rajshahi in 24 hours.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h4 className="font-extrabold text-hero-text text-sm">Secure Checkout</h4>
              <p className="text-xs text-muted-foreground mt-1">256-bit SSL encrypted payments.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-16">
          
          {/* Brand & Newsletter */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-3 inline-flex">
              <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-[#fbbf24] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-amber-500/10">
                <ShoppingBag className="w-4 h-4 text-black font-bold" />
              </div>
              <span className="text-2xl font-black text-hero-text tracking-tight">
                Mango<span className="text-[#fbbf24]">DB</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground font-medium pr-4">
              Your premium online mango marketplace. Experience the authentic taste of farm-direct Bangladeshi mangoes, delivered with utmost care.
            </p>

            <form onSubmit={handleSubscribe} className="pt-2 relative max-w-sm">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-background border border-border rounded-md py-3 pl-10 pr-12 text-sm font-medium text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-sm"
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer transition-colors"
                  title="Subscribe"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                Subscribe for exclusive discounts and harvest updates.
              </p>
            </form>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            {[
              {
                title: "Shop Varieties",
                links: [
                  { label: "Rajshahi Himsagar", href: "/products/himsagar-mangoes" },
                  { label: "Rangpur Haribhanga", href: "/products/haribhanga-mangoes" },
                  { label: "Chapainawabganj Lengra", href: "/products/lengra-mangoes" },
                  { label: "Corporate Gift Boxes", href: "/products" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "Our Story", href: "/#farm" },
                  { label: "Track Your Order", href: "/track" },
                  { label: "Browse All Products", href: "/products" },
                  { label: "Become a Seller", href: "/signup?seller=true" },
                ],
              },
              {
                title: "Legal & Support",
                links: [
                  { label: "Shipping & Delivery", href: "/legal/shipping" },
                  { label: "Refund & Return Policy", href: "/legal/refund" },
                  { label: "Terms of Service", href: "/legal/terms" },
                  { label: "Privacy Policy", href: "/legal/privacy" },
                ],
              },
            ].map((col) => (
              <div key={col.title} className="space-y-6">
                <h4 className="font-extrabold text-hero-text text-sm">
                  {col.title}
                </h4>
                <ul className="space-y-3.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200 inline-flex items-center gap-1 group"
                      >
                        <span className="w-0 h-[1px] bg-emerald-600 dark:bg-emerald-400 transition-all duration-300 group-hover:w-2"></span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-semibold text-muted-foreground">
            © {new Date().getFullYear()} MangoDB. All rights reserved.
          </p>
          
          <div className="flex items-center gap-5 text-xs font-bold text-muted-foreground">
            <a href="#" className="hover:text-emerald-600 transition-colors">
              Facebook
            </a>
            <a href="#" className="hover:text-emerald-600 transition-colors">
              Instagram
            </a>
            <a href="#" className="hover:text-emerald-600 transition-colors">
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
