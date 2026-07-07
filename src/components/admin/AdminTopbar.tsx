"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bell, ChevronDown, Menu, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient() as any;

  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifList, setNotifList] = useState<any[]>([]);

  // Load unread count
  useEffect(() => {
    async function loadNotifs() {
      if (!profile) {
        setUnreadNotifs(0);
        return;
      }
      if (!profile.id.startsWith("demo-")) {
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("is_read", false);
        if (count !== null) setUnreadNotifs(count);
      } else {
        const storedNotifs = JSON.parse(localStorage.getItem(`mangodb-notifications-${profile.id}`) || "[]");
        const count = storedNotifs.filter((n: any) => !n.is_read).length;
        setUnreadNotifs(count);
      }
    }
    loadNotifs();
    const interval = setInterval(loadNotifs, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  // Load full list when dropdown opens
  useEffect(() => {
    if (!notifDropdownOpen || !profile) return;
    const p = profile;
    async function loadFull() {
      if (!p.id.startsWith("demo-")) {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", p.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (data) setNotifList(data);
      } else {
        const stored = JSON.parse(localStorage.getItem(`mangodb-notifications-${p.id}`) || "[]");
        setNotifList(stored.slice(0, 10));
      }
    }
    loadFull();
  }, [notifDropdownOpen, profile]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!notifDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById("admin-notif-dropdown");
      if (el && !el.contains(e.target as Node)) setNotifDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifDropdownOpen]);

  const markAllRead = async () => {
    if (!profile) return;
    if (!profile.id.startsWith("demo-")) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", profile.id)
        .eq("is_read", false);
    } else {
      const stored = JSON.parse(localStorage.getItem(`mangodb-notifications-${profile.id}`) || "[]");
      const updated = stored.map((n: any) => ({ ...n, is_read: true }));
      localStorage.setItem(`mangodb-notifications-${profile.id}`, JSON.stringify(updated));
    }
    setUnreadNotifs(0);
    setNotifList(notifList.map((n: any) => ({ ...n, is_read: true })));
  };

  const markAsRead = async (id: string) => {
    if (!profile) return;
    if (!profile.id.startsWith("demo-")) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
    } else {
      const stored = JSON.parse(localStorage.getItem(`mangodb-notifications-${profile.id}`) || "[]");
      const updated = stored.map((n: any) => n.id === id ? { ...n, is_read: true } : n);
      localStorage.setItem(`mangodb-notifications-${profile.id}`, JSON.stringify(updated));
    }
    setUnreadNotifs(prev => Math.max(0, prev - 1));
    setNotifList(notifList.map((n: any) => n.id === id ? { ...n, is_read: true } : n));
  };

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
          <div id="admin-notif-dropdown" className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadNotifs > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white group-hover:ring-slate-50 animate-pulse" />
              )}
            </button>

            {/* Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-md shadow-lg z-50 overflow-hidden text-[#0F172A] font-sans">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Notifications
                  </h3>
                  {unreadNotifs > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer bg-transparent border-0 p-0"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifList.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400 font-medium">No notifications yet</p>
                    </div>
                  ) : (
                    notifList.map((n: any) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`px-4 py-3 hover:bg-slate-50/60 transition-colors flex gap-2.5 items-start cursor-pointer ${
                          !n.is_read ? "bg-indigo-50/30" : ""
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-sm mt-1.5 shrink-0 ${!n.is_read ? "bg-indigo-500" : "bg-transparent"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-slate-800 truncate">{n.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-medium">
                            {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-slate-100 text-center bg-slate-50/30">
                  <button
                    onClick={() => setNotifDropdownOpen(false)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer bg-transparent border-0 p-0"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

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
