"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard Overview",
  "/admin/products": "Product Management",
  "/admin/categories": "Category Management",
  "/admin/inventory": "Inventory Management",
  "/admin/orders": "Order Management",
  "/admin/customers": "Customer Management",
  "/admin/delivery": "Delivery Zones",
  "/admin/payments": "Payment Tracking",
  "/admin/coupons": "Coupons & Discounts",
  "/admin/content": "Homepage Content",
  "/admin/reviews": "Review Moderation",
  "/admin/reports": "Reports & Analytics",
  "/admin/settings": "Store Settings",
  "/admin/logs": "Activity Logs",
};

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export default function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();

  const pageTitle = PAGE_TITLES[pathname] || "Admin";

  return (
    <header className="sticky top-0 z-30 bg-[#0a1a12]/90 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="font-serif-heading text-lg font-black text-white tracking-tight">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications bell */}
          <button className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full" />
          </button>

          {/* Admin avatar */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-black shadow-sm">
              {(profile?.full_name || "A").charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-white/90 leading-tight">
                {profile?.full_name || "Administrator"}
              </p>
              <p className="text-[10px] text-emerald-400/60 font-semibold uppercase tracking-wider">
                Admin
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
