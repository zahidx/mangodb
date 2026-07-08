"use client";

import {
    ArrowRight,
    BadgeCheck,
    Camera,
    ChevronRight,
    Clock,
    Globe,
    Heart,
    Leaf,
    Mail,
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
import React, { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-100 relative">
      {/* ===== TOP GRADIENT BAR ===== */}
      <div className="h-1 bg-linear-to-r from-emerald-400 via-amber-400 to-emerald-400" />

      {/* ===== NEWSLETTER BANNER ===== */}
      <div className="border-b border-gray-100 bg-linear-to-r from-emerald-50/40 via-white to-amber-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-gray-900 font-bold text-base">Stay in the Loop</h3>
                <p className="text-gray-500 text-xs">Get exclusive offers, harvest updates &amp; mango tips</p>
              </div>
            </div>
            <form onSubmit={handleSubscribe} className="w-full lg:w-auto shrink-0 lg:min-w-105">
              {subscribed ? (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5">
                  <BadgeCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium text-sm">You&apos;re subscribed! Welcome to the MangoDB family. 🥭</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full">
                  <div className="relative w-full max-w-[280px] sm:max-w-none sm:flex-1">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="self-center sm:self-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    Subscribe
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* ===== BRAND COLUMN ===== */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/30 transition-shadow">
                <ShoppingBag className="w-5 h-5 text-gray-900" />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">
                Mango<span className="text-amber-500">DB</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-500">
              Bangladesh&apos;s premium online mango marketplace. We bring farm-fresh, naturally ripened mangoes straight from the orchards of Rajshahi to your doorstep.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Rajshahi Mango Hub, Boro Bazar, Rajshahi, Bangladesh</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <a href="tel:+8809677654321" className="hover:text-emerald-600 transition-colors">+880 9677-654321</a>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Daily: 8:00 AM - 10:00 PM</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { icon: Globe, label: "Facebook", hover: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" },
                { icon: Camera, label: "Instagram", hover: "hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200" },
                { icon: MessageCircle, label: "Twitter", hover: "hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200" },
                { icon: Video, label: "YouTube", hover: "hover:bg-red-50 hover:text-red-600 hover:border-red-200" },
              ].map((s) => (
                <a key={s.label} href="#" className={`w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 ${s.hover} transition-all`} aria-label={s.label}>
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
                  <col.icon className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-gray-900 font-bold text-sm uppercase tracking-wider">{col.title}</h4>
                </div>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-500 hover:text-emerald-600 transition-colors duration-200 inline-flex items-center gap-1.5 group"
                      >
                        <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
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
      <div className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Leaf, label: "100% Organic", desc: "Naturally ripened, no chemicals" },
              { icon: Truck, label: "Express Delivery", desc: "24-hour delivery from orchard" },
              { icon: ShieldCheck, label: "Secure Payment", desc: "256-bit SSL encrypted" },
              { icon: Sparkles, label: "Premium Quality", desc: "Handpicked & graded" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-gray-900 text-sm font-semibold">{item.label}</p>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PAYMENT METHODS ===== */}
      <div className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col xl:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-2 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Secure Payments
          </p>
          <div className="flex flex-wrap justify-center items-center gap-2.5">
            {/* VISA */}
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-1.5">
              <svg className="w-8 h-5" viewBox="0 0 48 30" fill="none"><rect width="48" height="30" rx="4" fill="#1A1F71"/><path d="M19.5 10L17 20h3l2.5-10h-3zM15 10l-2.5 7.5L12 15l-.5-2.5L15 10z" fill="white"/><path d="M28 10l-3 10h-2.5l3-10H28zM34.5 10c-1.5 0-3 .5-3.5 1.5l-.5 2.5h3l.5-1.5c.5-1 1.5-1.5 2.5-1.5h1.5l1-5h-2c-1 0-2 .5-2.5 1.5L34.5 10z" fill="white"/></svg>
              <span className="text-[9px] font-black text-blue-900">VISA</span>
            </div>
            {/* MasterCard */}
            <div className="px-3 py-1.5 bg-linear-to-r from-red-50 to-yellow-50 border border-red-100 rounded-lg flex items-center gap-1.5">
              <svg className="w-8 h-5" viewBox="0 0 48 30" fill="none"><rect width="48" height="30" rx="4" fill="#fff"/><circle cx="17" cy="15" r="8" fill="#EB001B"/><circle cx="31" cy="15" r="8" fill="#F79E1B" fillOpacity="0.8"/><circle cx="24" cy="15" r="5" fill="#FF5F00"/></svg>
              <span className="text-[9px] font-black text-gray-800">MC</span>
            </div>
            {/* Amex */}
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-1.5">
              <svg className="w-8 h-5" viewBox="0 0 48 30" fill="none"><rect width="48" height="30" rx="4" fill="#2E77BC"/><text x="8" y="20" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">AMEX</text></svg>
              <span className="text-[9px] font-black text-blue-800">AMEX</span>
            </div>
            {/* bKash */}
            <div className="px-3 py-1.5 bg-pink-50 border border-pink-100 rounded-lg flex items-center gap-1.5">
              <div className="w-8 h-5 rounded bg-pink-500 flex items-center justify-center">
                <span className="text-white font-black text-[10px]">bK</span>
              </div>
              <span className="text-[9px] font-black text-pink-700">bKash</span>
            </div>
            {/* Nagad */}
            <div className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg flex items-center gap-1.5">
              <div className="w-8 h-5 rounded bg-orange-500 flex items-center justify-center">
                <span className="text-white font-black text-[10px]">NG</span>
              </div>
              <span className="text-[9px] font-black text-orange-700">Nagad</span>
            </div>
            {/* Rocket */}
            <div className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg flex items-center gap-1.5">
              <div className="w-8 h-5 rounded bg-red-500 flex items-center justify-center">
                <span className="text-white font-black text-[10px]">R</span>
              </div>
              <span className="text-[9px] font-black text-red-700">Rocket</span>
            </div>
            {/* COD */}
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-1.5">
              <svg className="w-8 h-5" viewBox="0 0 48 30" fill="none"><rect width="48" height="30" rx="4" fill="#059669"/><path d="M14 12h20v10H14z" fill="white" opacity="0.9"/><path d="M18 16h12" stroke="#059669" strokeWidth="2"/><circle cx="24" cy="16" r="3" fill="#059669"/></svg>
              <span className="text-[9px] font-black text-emerald-700">COD</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM BAR ===== */}
      <div className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            &copy; {new Date().getFullYear()} <span className="text-gray-600 font-semibold">MangoDB</span>. All rights reserved. Made with <Heart className="w-3 h-3 text-red-400 inline fill-red-400/30" /> in Bangladesh.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-gray-400">
            <Link href="/legal/privacy" className="hover:text-emerald-600 transition-colors font-medium">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-emerald-600 transition-colors font-medium">Terms</Link>
            <Link href="/legal/shipping" className="hover:text-emerald-600 transition-colors font-medium">Shipping</Link>
            <Link href="/legal/refund" className="hover:text-emerald-600 transition-colors font-medium">Refunds</Link>
            <Link href="/admin-login" className="text-blue-500 hover:text-blue-600 transition-colors font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
