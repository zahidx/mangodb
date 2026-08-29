"use client";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import {
    Bell,
    ChevronDown,
    LayoutDashboard,
    LogOut,
    Menu,
    Moon,
    Package,
    Settings,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Sun,
    X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GlobalSearch from "./GlobalSearch";
import LanguageSwitcher from "./LanguageSwitcher";
import LoyaltyPointsBadge from "./LoyaltyPointsBadge";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuth();
  const supabase = createClient() as any;
  const { cartItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifList, setNotifList] = useState<any[]>([]);
  const notifRef = useState<HTMLDivElement | null>(null);

  // Load unread count
  useEffect(() => {
    async function loadNotifs() {
      if (!profile) {
        setUnreadNotifs(0);
        return;
      }
      if (!profile.id.startsWith("demo-")) {
        try {
          const { count, error } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id)
            .eq("is_read", false);
          if (!error && count !== null) setUnreadNotifs(count);
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        }
      } else {
        const storedNotifs = JSON.parse(localStorage.getItem(`mangobite-notifications-${profile.id}`) || "[]");
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
        try {
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", p.id)
            .order("created_at", { ascending: false })
            .limit(10);
          if (!error && data) setNotifList(data);
        } catch (err) {
          console.error("Failed to fetch full notifications:", err);
        }
      } else {
        const stored = JSON.parse(localStorage.getItem(`mangobite-notifications-${p.id}`) || "[]");
        setNotifList(stored.slice(0, 10));
      }
    }
    loadFull();
  }, [notifDropdownOpen, profile]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!notifDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById("notif-dropdown");
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
      const stored = JSON.parse(localStorage.getItem(`mangobite-notifications-${profile.id}`) || "[]");
      const updated = stored.map((n: any) => ({ ...n, is_read: true }));
      localStorage.setItem(`mangobite-notifications-${profile.id}`, JSON.stringify(updated));
    }
    setUnreadNotifs(0);
    setNotifList(notifList.map((n: any) => ({ ...n, is_read: true })));
  };

  // Sync theme state on mount
  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light");
    setTheme(isLight ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("mangobite-theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const getDisplayName = () => {
    if (!profile) return "User";
    if (profile.full_name && profile.full_name !== profile.email && !profile.full_name.includes('@')) {
      return profile.full_name;
    }
    return profile.email ? profile.email.split('@')[0] : "User";
  };

  const getShortName = () => {
    const name = getDisplayName();
    return name.split(' ')[0];
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 dark:bg-background/95 backdrop-blur-md border-b border-border transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between lg:justify-start h-20 lg:gap-12">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-5 h-5 text-gray-950" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black tracking-tight text-hero-text whitespace-nowrap">
              Mango<span className="text-emerald-600 dark:text-emerald-400">Bite</span>
            </span>
          </Link>

          {/* Nav Links - Desktop */}
          <div className="hidden lg:flex items-center gap-8 mr-auto">
            <Link
              href="/"
              className={`text-[15px] font-bold transition-colors duration-200 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-emerald-500 after:transition-all after:duration-300 hover:after:w-full ${
                pathname === "/" 
                  ? "text-emerald-700 dark:text-emerald-400 after:w-full" 
                  : "text-muted-foreground hover:text-hero-text after:w-0"
              }`}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`text-[15px] font-bold transition-colors duration-200 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-emerald-500 after:transition-all after:duration-300 hover:after:w-full ${
                pathname === "/products" 
                  ? "text-emerald-700 dark:text-emerald-400 after:w-full" 
                  : "text-muted-foreground hover:text-hero-text after:w-0"
              }`}
            >
              Products
            </Link>
            
            <Link
              href="/track"
              className={`text-[15px] font-bold transition-colors duration-200 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-emerald-500 after:transition-all after:duration-300 hover:after:w-full ${
                pathname === "/track" 
                  ? "text-emerald-700 dark:text-emerald-400 after:w-full" 
                  : "text-muted-foreground hover:text-hero-text after:w-0"
              }`}
            >
              Track Order
            </Link>

            <Link
              href="/orders"
              className={`text-[15px] font-bold transition-colors duration-200 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-emerald-500 after:transition-all after:duration-300 hover:after:w-full ${
                pathname === "/orders" 
                  ? "text-emerald-700 dark:text-emerald-400 after:w-full" 
                  : "text-muted-foreground hover:text-hero-text after:w-0"
              }`}
            >
              Orders
            </Link>
          </div>

          {/* Auth + Theme Toggle + Cart */}
          <div className="flex items-center gap-3 shrink-0 lg:pr-[45px]">
            {/* Global Search Bar */}
            <GlobalSearch />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Loyalty Points Badge */}
            {profile && <LoyaltyPointsBadge />}

            {/* Notification Bell with Dropdown */}
            {profile && (
              <div id="notif-dropdown" className="relative hidden lg:block">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2.5 rounded-md bg-muted-bg border border-border text-muted-foreground hover:text-[#fbbf24] hover:border-[#fbbf24]/30 transition-all shadow-sm cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-[10px] font-black text-white ring-2 ring-background animate-pulse-slow">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                      <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">
                        Notifications
                      </h3>
                      {unreadNotifs > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifList.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell className="w-6 h-6 mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                          <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">No notifications yet</p>
                        </div>
                      ) : (
                        notifList.map((n: any) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
                              !n.is_read ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? "bg-emerald-500" : "bg-transparent"}`} />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 dark:text-white">{n.title}</p>
                                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                                <p className="text-[9px] text-gray-400 dark:text-slate-500 mt-1">
                                  {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 text-center">
                      <button
                        onClick={() => { setNotifDropdownOpen(false); router.push("/dashboard?tab=notifications"); }}
                        className="text-[10px] font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        View all in Dashboard →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shopping Cart Indicator */}
            <Link
              href="/cart"
              className="hidden lg:block relative p-2.5 rounded-md bg-muted-bg border border-border text-muted-foreground hover:text-[#fbbf24] hover:border-[#fbbf24]/30 transition-all shadow-sm"
              aria-label="View Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white ring-2 ring-background shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="hidden lg:block p-2.5 rounded-md bg-muted-bg border border-border text-muted-foreground hover:text-[#fbbf24] hover:border-[#fbbf24]/30 transition-all shadow-sm cursor-pointer"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Auth options */}
            {profile ? (
              <div className="hidden sm:flex items-center gap-3 relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-md bg-muted-bg border border-border hover:border-emerald-500/30 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-[#fbbf24] to-[#f59e0b] flex items-center justify-center text-black text-sm font-black shadow-sm uppercase">
                    {getDisplayName()[0]}
                  </div>
                  <span className="text-sm font-bold text-hero-text max-w-[100px] truncate">
                    {getShortName()}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                    <div className="absolute top-[120%] right-0 w-60 bg-card border border-border rounded-md shadow-xl overflow-hidden py-1 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-border bg-muted-bg/50">
                        <p className="text-sm font-bold text-hero-text truncate">{getDisplayName()}</p>
                        <p className="text-xs text-muted-foreground truncate">{profile.phone || profile.email}</p>
                      </div>
                      
                      <div className="p-1">
                        {profile.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        <Link
                          href="/dashboard?tab=overview"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-hero-text hover:bg-emerald-500/10 hover:text-emerald-500 rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                          My Dashboard
                        </Link>
                        <Link
                          href="/dashboard?tab=orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-hero-text hover:bg-emerald-500/10 hover:text-emerald-500 rounded-md transition-colors"
                        >
                          <Package className="w-4 h-4 text-muted-foreground" />
                          My Orders
                        </Link>
                        <Link
                          href="/dashboard?tab=account"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-hero-text hover:bg-emerald-500/10 hover:text-emerald-500 rounded-md transition-colors"
                        >
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          Update Profile
                        </Link>
                      </div>

                      <div className="p-1 border-t border-border">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-block text-sm font-semibold text-muted hover:text-hero-text transition-colors px-4 py-2 whitespace-nowrap"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="hidden sm:inline-block text-sm font-bold text-black bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] px-6 py-3 rounded-md hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 whitespace-nowrap"
                >
                  Sign up
                </Link>
              </>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-md bg-muted-bg border border-border text-foreground hover:border-[#fbbf24]/30 transition-all cursor-pointer shadow-sm"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 z-[60]" : "opacity-0 -z-10 pointer-events-none"}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div 
        className={`lg:hidden fixed top-0 left-0 h-[100dvh] w-[280px] bg-background shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col z-[70] ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Drawer Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-border shrink-0">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[12px] bg-[#fbbf24] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-tight text-red-600 whitespace-nowrap">
              Mango<span className="text-[#20BA5A]">Bite</span>
            </span>
          </Link>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-md bg-muted-bg border border-border text-foreground hover:border-[#fbbf24]/30 transition-all cursor-pointer shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-muted hover:text-[#fbbf24] transition-colors py-2"
            >
              Home
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-muted hover:text-[#fbbf24] transition-colors py-2"
            >
              Products
            </Link>
            
            <Link
              href="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-muted hover:text-[#fbbf24] transition-colors py-2"
            >
              Track Order
            </Link>

            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-muted hover:text-[#fbbf24] transition-colors py-2"
            >
              Orders
            </Link>

            {/* Quick Actions (Icons Only) */}
            <div className="flex items-center justify-center gap-6 py-2 border-t border-border/50 pt-4 mt-2">
              {/* Notifications */}
              {profile && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (pathname === "/dashboard") {
                      window.location.href = "/dashboard?tab=notifications";
                    } else {
                      router.push("/dashboard?tab=notifications");
                    }
                  }}
                  className="relative p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 active:scale-[0.95] transition-all cursor-pointer shadow-sm"
                  aria-label="View Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-[10px] font-black text-white ring-2 ring-background animate-pulse-slow">
                      {unreadNotifs}
                    </span>
                  )}
                </button>
              )}

              {/* Cart */}
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="relative p-3 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 active:scale-[0.95] transition-all cursor-pointer shadow-sm"
                aria-label="View Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white ring-2 ring-background shadow-md">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-3 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 active:scale-[0.95] transition-all cursor-pointer shadow-sm"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            <div className="pt-4 border-t border-border flex flex-col gap-3">
              {profile ? (
                <div className="flex flex-col">
                  <button 
                    onClick={() => setMobileProfileOpen(!mobileProfileOpen)}
                    className="w-full p-3 bg-muted-bg border border-border rounded-md flex items-center justify-between shadow-sm cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-9 h-9 rounded-md bg-gradient-to-tr from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-black shadow-inner shrink-0">
                        {getDisplayName()[0].toUpperCase()}
                      </div>
                      <div className="overflow-hidden text-left">
                        <p className="font-bold text-hero-text text-sm tracking-tight truncate">{getDisplayName()}</p>
                        <p className="text-muted-foreground text-[11px] font-medium truncate opacity-70">{profile.phone || profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        {profile.role}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${mobileProfileOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ${mobileProfileOpen ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
                    <div className="space-y-1">
                      {profile.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-amber-500/10 transition-all text-sm font-bold text-amber-600 dark:text-amber-500 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 group-hover:scale-110 transition-transform shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      Admin Panel
                    </Link>
                  )}

                  <Link
                    href="/dashboard?tab=overview"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted-bg transition-all text-sm font-semibold text-hero-text group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    My Dashboard
                  </Link>

                  <Link
                    href="/dashboard?tab=orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted-bg transition-all text-sm font-semibold text-hero-text group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    My Orders
                  </Link>

                  <Link
                    href="/dashboard?tab=account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted-bg transition-all text-sm font-semibold text-hero-text group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform shrink-0">
                      <Settings className="w-4 h-4" />
                    </div>
                    Update Profile
                  </Link>

                  <div className="h-[1px] bg-border my-2 mx-2"></div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 transition-all text-sm font-semibold text-red-500 group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    Log Out
                  </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center text-sm font-semibold text-muted hover:text-hero-text transition-colors px-4 py-3 rounded-xl border border-border"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center text-sm font-bold text-black bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] px-6 py-3 rounded-xl transition-all"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
    </nav>
  );
}
