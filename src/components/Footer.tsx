"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-footer-bg border-t border-border py-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-muted">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#fbbf24] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-amber-500/10">
                <ShoppingBag className="w-4 h-4 text-black font-bold" />
              </div>
              <span className="text-xl font-extrabold text-hero-text">
                Mango<span className="text-[#fbbf24]">DB</span>
              </span>
            </Link>
            <p className="leading-relaxed text-muted-foreground">
              Your premium online mango marketplace. Fresh, farm-direct Bangladeshi mangoes delivered with care. Built with Next.js, Tailwind CSS, and Supabase.
            </p>
          </div>

          {[
            {
              title: "Shop Varieties",
              links: [
                { label: "Rajshahi Himsagar", href: "/products/himsagar-mangoes" },
                { label: "Rangpur Haribhanga", href: "/products/haribhanga-mangoes" },
                { label: "Chapainawabganj Lengra", href: "/products/lengra-mangoes" },
              ],
            },
            {
              title: "For Farmers",
              links: [
                { label: "Become a Seller", href: "/signup?seller=true" },
                { label: "Quality Standards", href: "#" },
                { label: "Payment Verification", href: "#" },
              ],
            },
            {
              title: "Support",
              links: [
                { label: "Help Center", href: "#" },
                { label: "Shipping Policy (BD)", href: "#" },
                { label: "Terms of Service", href: "#" },
              ],
            },
          ].map((col) => (
            <div key={col.title} className="space-y-4">
              <h4 className="font-extrabold text-hero-text text-xs uppercase tracking-widest">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-[#fbbf24] transition-colors duration-200 text-muted-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 MangoDB. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Powered by Next.js 16 + Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
