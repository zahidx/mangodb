"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bell, ChevronDown, Menu, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

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
  const { profile, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const pageTitle = PAGE_TITLES[pathname] || "Admin";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb-style title */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-medium">Admin</span>
            <span className="text-slate-300">/</span>
            <h1 className="text-sm font-black text-slate-800 tracking-tight">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications bell */}
          <button className="relative p-2.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer group">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white group-hover:ring-slate-50 animate-pulse" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200/60" />

          {/* Admin avatar */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 pl-1 cursor-pointer group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-black text-xs font-black shadow-sm group-hover:shadow-md group-hover:shadow-amber-500/20 transition-shadow">
                {getInitials(profile?.full_name || "Admin")}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-700 leading-tight group-hover:text-slate-900 transition-colors">
                  {profile?.full_name || "Administrator"}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                  Admin
                  <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </p>
              </div>
            </button>
            
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
