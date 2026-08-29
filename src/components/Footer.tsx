"use client";

import {
    Camera,
    ChevronRight,
    Clock,
    Globe,
    Heart,
    Leaf,
    MapPin,
    MessageCircle,
    Package,
    Phone,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Truck,
    Video
} from "lucide-react";
import Link from "next/link";
import React from "react";

export default function Footer() {


  return (
    <footer className="bg-card dark:bg-[#04060c] border-t border-border relative transition-colors duration-200">
      {/* ===== TOP ACCENT BAR ===== */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* ===== BRAND COLUMN ===== */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:shadow-amber-500/30 transition-shadow">
                <ShoppingBag className="w-5 h-5 text-gray-950" />
              </div>
              <span className="text-2xl font-black text-hero-text tracking-tight">
                Mango<span className="text-emerald-600 dark:text-emerald-400">Bite</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Bangladesh&apos;s premium online mango marketplace. We bring farm-fresh, naturally ripened mangoes straight from the certified orchards of Rajshahi to your doorstep.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Rajshahi Mango Hub, Boro Bazar, Rajshahi, Bangladesh</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <a href="tel:+8809677654321" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">+880 9677-654321</a>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Daily: 8:00 AM - 10:00 PM</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { icon: Globe, label: "Facebook", hover: "hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400" },
                { icon: Camera, label: "Instagram", hover: "hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400" },
                { icon: MessageCircle, label: "Twitter", hover: "hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400" },
                { icon: Video, label: "YouTube", hover: "hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  className={`w-10 h-10 rounded-xl bg-muted-bg border border-border flex items-center justify-center text-muted-foreground ${s.hover} transition-all cursor-pointer`}
                  aria-label={s.label}
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* ===== LINKS COLUMNS ===== */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                title: "Shop",
                icon: Package,
                links: [
                  { label: "All Mangoes", href: "/products" },
                  { label: "Himsagar", href: "/products/himsagar-mangoes" },
                  { label: "Haribhanga", href: "/products/haribhanga-mangoes" },
                  { label: "Lengra", href: "/products/lengra-mangoes" },
                  { label: "Gift Boxes", href: "/products" },
                ],
              },
              {
                title: "Company",
                icon: Heart,
                links: [
                  { label: "Our Story", href: "/#farm" },
                  { label: "Track Order", href: "/track" },
                  { label: "Become a Seller", href: "/signup?seller=true" },
                  { label: "Contact Us", href: "/#contact" },
                  { label: "Blog", href: "/#farm" },
                ],
              },
              {
                title: "Support",
                icon: ShieldCheck,
                links: [
                  { label: "Shipping Info", href: "/legal/shipping" },
                  { label: "Returns & Refunds", href: "/legal/refund" },
                  { label: "Terms of Service", href: "/legal/terms" },
                  { label: "Privacy Policy", href: "/legal/privacy" },
                  { label: "FAQ", href: "/legal/terms" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="flex items-center gap-2 mb-4">
                  <col.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-hero-text font-bold text-sm uppercase tracking-wider">{col.title}</h4>
                </div>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200 inline-flex items-center gap-1.5 group"
                      >
                        <ChevronRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== TRUST BADGES ===== */}
      <div className="border-t border-border bg-muted-bg/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Leaf, label: "100% Organic", desc: "Naturally ripened, no chemicals" },
              { icon: Truck, label: "Express Delivery", desc: "48-hour cold-chain dispatch" },
              { icon: ShieldCheck, label: "Secure Payment", desc: "256-bit SSL encrypted" },
              { icon: Sparkles, label: "Premium Quality", desc: "Handpicked & brix tested" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-hero-text text-sm font-semibold">{item.label}</p>
                  <p className="text-muted-foreground text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PAYMENT METHODS ===== */}
      <div className="border-t border-border bg-card dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col xl:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-2 text-center font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Verified Secure Payment Gateway
          </p>
          <div className="flex flex-wrap justify-center items-center gap-2.5">
            {/* VISA */}
            <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-1.5">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 font-mono">VISA</span>
            </div>
            {/* MasterCard */}
            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-1.5">
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 font-mono">MASTERCARD</span>
            </div>
            {/* bKash */}
            <div className="px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-lg flex items-center gap-1.5">
              <span className="text-[10px] font-black text-pink-600 dark:text-pink-400 font-mono">bKash</span>
            </div>
            {/* Nagad */}
            <div className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center gap-1.5">
              <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 font-mono">Nagad</span>
            </div>
            {/* Rocket */}
            <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center gap-1.5">
              <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 font-mono">Rocket</span>
            </div>
            {/* COD */}
            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-1.5">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 font-mono">Cash On Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM BAR ===== */}
      <div className="border-t border-border bg-muted-bg/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            &copy; {new Date().getFullYear()} <span className="text-hero-text font-semibold">MangoBite</span>. All rights reserved. Hand-harvested in Rajshahi, Bangladesh.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
            <Link href="/legal/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">Terms</Link>
            <Link href="/legal/shipping" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">Shipping</Link>
            <Link href="/legal/refund" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">Refunds</Link>
            <Link href="/admin-login" className="text-emerald-600 dark:text-emerald-400 hover:underline transition-colors font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
