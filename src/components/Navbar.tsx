"use client";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
    LayoutDashboard,
    LogOut,
    Menu,
    Moon,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Sun,
    X,
    ChevronDown,
    Package,
    Settings,
    User,
    Bell
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GlobalSearch from "./GlobalSearch";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuth();
  const supabase = createClient() as any;
  const { cartItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // Load unread notifications
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

    // Optionally set up an interval to refresh notifs
    const interval = setInterval(loadNotifs, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [profile]);

  // Sync theme state on mount
  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light");
    setTheme(isLight ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("mangodb-theme", nextTheme);
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f4f7f5] dark:bg-background border-b border-gray-200 dark:border-border/10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between lg:justify-start h-20 lg:gap-12">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-[12px] bg-[#fbbf24] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black tracking-tight text-red-600 whitespace-nowrap">
              Mango<span className="text-[#20BA5A]">DB</span>
            </span>
          </Link>

          {/* Nav Links - Desktop */}
          <div className="hidden lg:flex items-center gap-8 mr-auto">
            <Link
              href="/products"
              className={`text-[15px] font-bold transition-colors duration-200 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-[#20BA5A] after:transition-all after:duration-300 hover:after:w-full ${
                pathname === "/products" 
                  ? "text-[#1a2e24] after:w-full" 
                  : "text-[#3b574a] dark:text-muted after:w-0"
              }`}
            >
              Shop Mangoes
            </Link>
            
            <Link
              href="/#varieties"
              className="text-[15px] font-bold text-[#3b574a] dark:text-muted transition-colors duration-200 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#20BA5A] hover:after:w-full after:transition-all after:duration-300"
            >
              Varieties
            </Link>


            <Link
              href="/track"
              className={`text-[15px] font-bold transition-colors duration-200 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-[#20BA5A] after:transition-all after:duration-300 hover:after:w-full ${
                pathname === "/track" 
                  ? "text-[#1a2e24] after:w-full" 
                  : "text-[#3b574a] dark:text-muted after:w-0"
              }`}
            >
              Track Crate
            </Link>

            <Link
              href="/#farm"
              className="text-[15px] font-bold text-[#3b574a] dark:text-muted transition-colors duration-200 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#20BA5A] hover:after:w-full after:transition-all after:duration-300"
            >
              Our Story
            </Link>
          </div>

          {/* Auth + Theme Toggle + Cart */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Global Search Bar */}
            <GlobalSearch />

            {/* Notification Bell */}
            {profile && (
              <button
                onClick={() => {
                  if (pathname === "/dashboard") {
                    window.location.href = "/dashboard?tab=notifications";
                  } else {
                    router.push("/dashboard?tab=notifications");
                  }
                }}
                className="relative p-2.5 rounded-md bg-muted-bg border border-border text-muted-foreground hover:text-[#fbbf24] hover:border-[#fbbf24]/30 transition-all shadow-sm cursor-pointer"
                aria-label="View Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-[10px] font-black text-white ring-2 ring-background animate-pulse-slow">
                    {unreadNotifs}
                  </span>
                )}
              </button>
            )}

            {/* Shopping Cart Indicator */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-md bg-muted-bg border border-border text-muted-foreground hover:text-[#fbbf24] hover:border-[#fbbf24]/30 transition-all shadow-sm"
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
              className="p-2.5 rounded-md bg-muted-bg border border-border text-muted-foreground hover:text-[#fbbf24] hover:border-[#fbbf24]/30 transition-all shadow-sm cursor-pointer"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Auth options */}
            {profile ? (
              <div className="hidden sm:flex items-center gap-3 relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-muted-bg border border-border hover:border-emerald-500/30 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#fbbf24] to-[#f59e0b] flex items-center justify-center text-black text-sm font-black shadow-sm uppercase">
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
                    <div className="absolute top-[120%] right-0 w-60 bg-card border border-border rounded-2xl shadow-xl overflow-hidden py-1 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-border bg-muted-bg/50">
                        <p className="text-sm font-bold text-hero-text truncate">{getDisplayName()}</p>
                        <p className="text-xs text-muted-foreground truncate">{profile.phone || profile.email}</p>
                      </div>
                      
                      <div className="p-1">
                        {profile.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-amber-500 hover:bg-amber-500/10 rounded-xl transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        <Link
                          href="/dashboard?tab=overview"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-hero-text hover:bg-emerald-500/10 hover:text-emerald-500 rounded-xl transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                          My Dashboard
                        </Link>
                        <Link
                          href="/dashboard?tab=orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-hero-text hover:bg-emerald-500/10 hover:text-emerald-500 rounded-xl transition-colors"
                        >
                          <Package className="w-4 h-4 text-muted-foreground" />
                          My Orders
                        </Link>
                        <Link
                          href="/dashboard?tab=account"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-hero-text hover:bg-emerald-500/10 hover:text-emerald-500 rounded-xl transition-colors"
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
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
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

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background shadow-lg animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-muted hover:text-[#fbbf24] transition-colors py-2"
            >
              Shop Mangoes
            </Link>
            
            <Link
              href="/#varieties"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-muted hover:text-[#fbbf24] transition-colors py-2"
            >
              Varieties
            </Link>


            <Link
              href="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-muted hover:text-[#fbbf24] transition-colors py-2"
            >
              Track Crate
            </Link>

            <Link
              href="/#farm"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-muted hover:text-[#fbbf24] transition-colors py-2"
            >
              Our Story
            </Link>

            {/* Notifications Link in Mobile */}
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
                className="w-full flex items-center justify-between text-base font-medium text-muted hover:text-[#fbbf24] transition-colors py-2 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5" />
                  Notifications
                </div>
                {unreadNotifs > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold">
                    {unreadNotifs} new
                  </span>
                )}
              </button>
            )}

            {/* Cart Link in Mobile */}
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-base font-medium text-muted hover:text-[#fbbf24] transition-colors py-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Cart ({cartCount})
            </Link>

            {/* Theme toggle in mobile */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full text-base font-medium text-muted hover:text-[#fbbf24] transition-colors py-2 cursor-pointer text-left"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>

            <div className="pt-4 border-t border-border flex flex-col gap-3">
              {profile ? (
                <div className="space-y-3">
                  <div className="p-3 bg-section-alt border border-border rounded-xl flex items-center justify-between text-xs font-sans">
                    <div>
                      <p className="font-bold text-hero-text">{getDisplayName()}</p>
                      <p className="text-muted-foreground">{profile.phone || profile.email}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold capitalize">
                      {profile.role}
                    </span>
                  </div>
                  
                  {profile.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center text-sm font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 py-3 rounded-xl hover:bg-amber-500/20 transition-all mb-2"
                    >
                      Admin Panel
                    </Link>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/dashboard?tab=overview"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-xl hover:bg-emerald-500/20 transition-all"
                    >
                      My Dashboard
                    </Link>
                    <Link
                      href="/dashboard?tab=orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center text-xs font-bold text-hero-text bg-muted-bg border border-border py-3 rounded-xl hover:bg-section-alt transition-all"
                    >
                      My Orders
                    </Link>
                    <Link
                      href="/dashboard?tab=account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center text-xs font-bold text-hero-text bg-muted-bg border border-border py-3 rounded-xl hover:bg-section-alt transition-all col-span-2"
                    >
                      Update Profile
                    </Link>
                  </div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-center text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 py-3 rounded-xl border border-red-500/20 transition-all cursor-pointer"
                  >
                    Log Out
                  </button>
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
      )}
    </nav>
  );
}
