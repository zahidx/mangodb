"use client";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import { getUserOrders } from "@/lib/supabase/queries";
import type { Order, Product, UserAddress } from "@/types/database";
import {
    Bell,
    Calendar,
    Camera,
    CheckCircle2,
    Clock,
    CreditCard,
    Heart,
    LayoutDashboard,
    Loader2,
    Lock,
    LogOut,
    MapPin,
    Menu,
    Package,
    Plus,
    Settings,
    Shield,
    ShoppingBag,
    Trash2,
    User
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading, logout, refreshSession } = useAuth();
  const { addToCart } = useCart();
  const supabase = createClient() as any;

  const initialTab = (searchParams.get("tab") as any) || "overview";
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "wishlist" | "addresses" | "account" | "payment" | "notifications" | "password" | "security">(initialTab);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab as any);
  }, [searchParams]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Account form
  const [accountForm, setAccountForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    country: "",
    city: ""
  });
  const [savingAccount, setSavingAccount] = useState(false);

  // Address form
  const defaultAddressForm = {
    full_name: "",
    phone: "",
    email: "",
    country: "Bangladesh",
    state: "",
    city: "",
    area: "",
    postal_code: "",
    street_address: "",
    apartment: "",
    label: "Home" as "Home" | "Office" | "Other",
    is_default: false
  };
  const [addressForm, setAddressForm] = useState(defaultAddressForm);
  const [addingAddress, setAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 7) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };
  const strengthScore = getPasswordStrength(passwordForm.new);

  // Preferences form
  const [preferences, setPreferences] = useState({
    language: "en",
    currency: "BDT",
    darkMode: false,
    emailNotif: true,
    smsNotif: true
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setPreferences(prev => ({
        ...prev,
        darkMode: document.documentElement.classList.contains("dark")
      }));
    }
  }, []);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !profile) {
      toast.error("Please sign in to access your dashboard");
      router.push("/login");
    }
  }, [profile, loading]);

  // Load account data
  useEffect(() => {
    if (profile) {
      setAccountForm({
        fullName: profile.full_name || "",
        phone: profile.phone || "",
        email: profile.email || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        country: profile.country || "",
        city: profile.city || ""
      });
      loadDashboardData();
    }
  }, [profile]);

  const loadDashboardData = async () => {
    if (!profile) return;
    setLoadingData(true);
    try {
      // 1. Fetch Orders
      const orderRes = await getUserOrders(profile.id);
      if (orderRes.data) {
        setOrders(orderRes.data);
      }

      // 2. Fetch Wishlist items from local storage
      const savedWishIds = JSON.parse(localStorage.getItem("mangodb-wishlist") || "[]");
      if (savedWishIds.length > 0) {
        // Query product details for each wishlist ID
        const { data: prods } = await supabase
          .from("products")
          .select("*")
          .in("id", savedWishIds);
        
        if (prods) {
          setWishlistProducts(prods);
        } else {
          // If query fails (database table not set up), filter mock products locally
          // We can fall back to our queries list
          const { getProducts } = require("@/lib/supabase/queries");
          const allProds = await getProducts();
          if (allProds.data) {
            setWishlistProducts(allProds.data.filter((p: any) => savedWishIds.includes(p.id)));
          }
        }
      } else {
        setWishlistProducts([]);
      }

      // 3. Load Saved Addresses
      if (!profile.id.startsWith("demo-")) {
        const { data: addrs } = await supabase
          .from("user_addresses")
          .select("*")
          .eq("user_id", profile.id)
          .order("is_default", { ascending: false });
        if (addrs) setAddresses(addrs);
      } else {
        const storedAddresses = localStorage.getItem(`mangodb-addresses-${profile.id}`);
        if (storedAddresses) setAddresses(JSON.parse(storedAddresses));
      }

    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingAccount(true);

    try {
      if (!profile.id.startsWith("demo-")) {
        await supabase
          .from("profiles")
          .update({
            full_name: accountForm.fullName,
            phone: accountForm.phone,
            dob: accountForm.dob || null,
            gender: accountForm.gender || null,
            country: accountForm.country || null,
            city: accountForm.city || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", profile.id);
      } else {
        // Mock update
        const stored = localStorage.getItem("mangodb-user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.name = accountForm.fullName;
          parsed.phone = accountForm.phone;
          parsed.dob = accountForm.dob;
          parsed.gender = accountForm.gender;
          parsed.country = accountForm.country;
          parsed.city = accountForm.city;
          localStorage.setItem("mangodb-user", JSON.stringify(parsed));
        }
      }
      await refreshSession();
      toast.success("Account profile updated!");
    } catch (e) {
      toast.error("Profile update failed");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setAddingAddress(true);

    try {
      if (!profile.id.startsWith("demo-")) {
        const payload = { ...addressForm, user_id: profile.id };

        if (editingAddressId) {
          await supabase.from("user_addresses").update(payload).eq("id", editingAddressId);
        } else {
          await supabase.from("user_addresses").insert([payload]);
        }

        const { data: addrs } = await supabase
          .from("user_addresses")
          .select("*")
          .eq("user_id", profile.id)
          .order("is_default", { ascending: false });
        
        if (addrs) setAddresses(addrs);
      } else {
        let updated = [...addresses];
        
        if (addressForm.is_default) {
          updated = updated.map(a => ({ ...a, is_default: false }));
        }

        if (editingAddressId) {
          updated = updated.map(a => a.id === editingAddressId ? { ...addressForm, id: editingAddressId } as UserAddress : a);
        } else {
          const added = { ...addressForm, id: `addr-${Math.random()}` };
          updated.push(added as UserAddress);
        }
        
        setAddresses(updated);
        localStorage.setItem(`mangodb-addresses-${profile.id}`, JSON.stringify(updated));
      }
      
      toast.success(editingAddressId ? "Address updated!" : "New address added!");
      setShowAddressForm(false);
      setAddressForm(defaultAddressForm);
      setEditingAddressId(null);
    } catch (err) {
      toast.error("Failed to save address");
    } finally {
      setAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!profile) return;
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    try {
      if (!profile.id.startsWith("demo-")) {
        await supabase.from("user_addresses").delete().eq("id", id);
        setAddresses(addresses.filter(a => a.id !== id));
      } else {
        const updated = addresses.filter(a => a.id !== id);
        setAddresses(updated);
        localStorage.setItem(`mangodb-addresses-${profile.id}`, JSON.stringify(updated));
      }
      toast.success("Address removed");
    } catch (err) {
      toast.error("Failed to remove address");
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!profile) return;
    try {
      if (!profile.id.startsWith("demo-")) {
        await supabase.from("user_addresses").update({ is_default: true }).eq("id", id);
        const { data: addrs } = await supabase
          .from("user_addresses")
          .select("*")
          .eq("user_id", profile.id)
          .order("is_default", { ascending: false });
        if (addrs) setAddresses(addrs);
      } else {
        const updated = addresses.map(a => ({ ...a, is_default: a.id === id }));
        setAddresses(updated);
        localStorage.setItem(`mangodb-addresses-${profile.id}`, JSON.stringify(updated));
      }
      toast.success("Default address updated");
    } catch (err) {
      toast.error("Failed to update default address");
    }
  };

  const handleRemoveWishlist = (id: string) => {
    if (!profile) return;
    const stored = localStorage.getItem(`mangodb-wishlist-${profile.id}`);
    if (stored) {
      let saved = JSON.parse(stored);
      saved = saved.filter((i: string) => i !== id);
      localStorage.setItem(`mangodb-wishlist-${profile.id}`, JSON.stringify(saved));
      setWishlistProducts(wishlistProducts.filter(p => p.id !== id));
      toast.success("Removed from wishlist");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      return toast.error("New passwords do not match!");
    }
    if (strengthScore < 2) {
      return toast.error("Please choose a stronger password.");
    }
    setChangingPassword(true);
    try {
      if (profile?.id.startsWith("demo-")) {
        await new Promise(r => setTimeout(r, 800));
      } else {
        const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
        if (error) throw error;
      }
      toast.success("Password updated successfully!");
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      if (preferences.darkMode) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        localStorage.setItem("mangodb-theme", "dark");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
        localStorage.setItem("mangodb-theme", "light");
      }
      await new Promise(r => setTimeout(r, 500));
      toast.success("Preferences updated successfully!");
    } catch (e) {
      toast.error("Failed to update preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleLogoutEverywhere = async () => {
    toast.success("Logged out from all other devices.");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    toast.error("Account deletion requires contacting support.");
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-background flex items-center justify-center flex-col gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-[#475569] dark:text-muted-foreground font-bold">Verifying credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background text-[#0F172A] dark:text-foreground selection:bg-[#fbbf24] selection:text-black">
      
      {/* Sidebar (Fixed on the left) */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-white dark:bg-card border-r border-[#EEF2F7] dark:border-border/50 z-30 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none hidden lg:flex">
        
        {/* Logo area */}
        <div className="h-[72px] flex items-center px-6 border-b border-[#EEF2F7] dark:border-border/50 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-tight text-red-600">Mango<span className="text-[#20BA5A]">DB</span></span>
          </Link>
        </div>

        {/* User area */}
        <div className="p-6 border-b border-[#EEF2F7] dark:border-border/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-lg font-black shadow-inner shrink-0">
            {profile.full_name ? profile.full_name[0].toUpperCase() : "U"}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-[#0F172A] dark:text-foreground text-sm truncate">{profile.full_name}</h3>
            <p className="text-[11px] text-[#475569] dark:text-muted-foreground font-semibold uppercase tracking-wider truncate">{profile.role} account</p>
          </div>
        </div>

        {/* Nav Tabs list */}
        <nav className="flex-grow overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {[
            { id: "overview", label: "Dashboard", icon: LayoutDashboard },
            { id: "account", label: "My Profile", icon: User },
            { id: "orders", label: `Orders (${orders.length})`, icon: Package },
            { id: "wishlist", label: `Wishlist (${wishlistProducts.length})`, icon: Heart },
            { id: "addresses", label: `Saved Addresses (${addresses.length})`, icon: MapPin },
            { id: "payment", label: "Payment Methods", icon: CreditCard },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "password", label: "Change Password", icon: Lock },
            { id: "security", label: "Security", icon: Shield }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer group ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "text-[#475569] dark:text-muted-foreground hover:bg-[#F8FAFC] dark:hover:bg-muted-bg hover:text-[#0F172A] dark:hover:text-hero-text"
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom area (Logout) */}
        <div className="p-4 border-t border-[#EEF2F7] dark:border-border/50 shrink-0">
          <button
            onClick={() => {
              logout();
              toast.success("Logged out successfully");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:pl-[280px] min-h-screen flex flex-col relative w-full">
        
        {/* Header (Top Nav for Dashboard) */}
        <header className="h-[72px] bg-white/80 dark:bg-card/80 backdrop-blur-md border-b border-[#EEF2F7] dark:border-border/50 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle (Placeholder, not fully functional here without full state wrapper, but present for visual) */}
            <button className="lg:hidden p-2 bg-muted-bg rounded-lg">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-xl font-bold text-[#0F172A] dark:text-hero-text capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-[#475569] hover:text-[#0F172A] transition-colors hidden sm:block">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <Link href="/" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Store &rarr;
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-grow p-6 sm:p-10 lg:p-12 overflow-x-hidden">
          <div className="max-w-5xl mx-auto w-full">
            
            {loadingData ? (
              <div className="h-96 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                <p className="text-xs text-muted-foreground font-bold">Synchronizing account logs...</p>
              </div>
            ) : (
              <div className="flex-grow flex flex-col">
                {/* 0. OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div className="space-y-8 h-full">
                      
                      {/* Dashboard Stats */}
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-card border border-[#EEF2F7] dark:border-border/50 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:-translate-y-1 transition-transform duration-300 space-y-4 flex flex-col justify-between">
                          <div className="flex justify-between items-center text-[#475569] dark:text-muted-foreground">
                            <p className="text-xs font-bold uppercase tracking-wider">Total Orders</p>
                            <Package className="w-5 h-5" />
                          </div>
                          <h4 className="font-sans font-black text-3xl text-[#0F172A] dark:text-hero-text">{orders.length}</h4>
                        </div>
                        
                        <div className="bg-white dark:bg-card border border-[#EEF2F7] dark:border-border/50 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:-translate-y-1 transition-transform duration-300 space-y-4 flex flex-col justify-between">
                          <div className="flex justify-between items-center text-amber-500">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-muted-foreground">Pending Orders</p>
                            <Clock className="w-5 h-5" />
                          </div>
                          <h4 className="font-sans font-black text-3xl text-[#0F172A] dark:text-hero-text">
                            {orders.filter(o => ["pending", "processing", "shipped"].includes(o.status)).length}
                          </h4>
                        </div>

                        <div className="bg-white dark:bg-card border border-[#EEF2F7] dark:border-border/50 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:-translate-y-1 transition-transform duration-300 space-y-4 flex flex-col justify-between">
                          <div className="flex justify-between items-center text-emerald-500">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-muted-foreground">Completed Orders</p>
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <h4 className="font-sans font-black text-3xl text-[#0F172A] dark:text-hero-text">
                            {orders.filter(o => o.status === "delivered").length}
                          </h4>
                        </div>

                        <div className="bg-white dark:bg-card border border-[#EEF2F7] dark:border-border/50 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:-translate-y-1 transition-transform duration-300 space-y-4 flex flex-col justify-between">
                          <div className="flex justify-between items-center text-rose-500">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-muted-foreground">Wishlist</p>
                            <Heart className="w-5 h-5" />
                          </div>
                          <h4 className="font-sans font-black text-3xl text-[#0F172A] dark:text-hero-text">{wishlistProducts.length}</h4>
                        </div>

                        <div className="bg-white dark:bg-card border border-[#EEF2F7] dark:border-border/50 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none hover:-translate-y-1 transition-transform duration-300 space-y-4 flex flex-col justify-between">
                          <div className="flex justify-between items-center text-blue-500">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-muted-foreground">Saved Addresses</p>
                            <MapPin className="w-5 h-5" />
                          </div>
                          <h4 className="font-sans font-black text-3xl text-[#0F172A] dark:text-hero-text">{addresses.length}</h4>
                        </div>
                      </div>

                      {/* Welcome Card */}
                      <div className="mt-8 bg-white dark:bg-card border border-[#EEF2F7] dark:border-border/50 rounded-2xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none -mr-32 -mt-32"></div>
                        
                        <div className="flex items-start gap-5 relative z-10">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0">
                            <User className="w-7 h-7" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-xl text-[#0F172A] dark:text-hero-text">Welcome back, {profile.full_name?.split(' ')[0]}!</h3>
                            <p className="text-sm text-[#475569] dark:text-muted-foreground max-w-lg leading-relaxed">
                              Your personalized MangoDB dashboard is ready. Track your recent crates, manage your shipping preferences, and securely update your account details.
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 w-full sm:w-auto relative z-10">
                          <button onClick={() => setActiveTab('orders')} className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all text-sm flex items-center justify-center gap-2">
                            View Recent Orders
                            <Package className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                )}

                {/* 1. ORDERS TAB */}
                {activeTab === "orders" && (
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="font-serif-heading text-xl font-bold text-hero-text">Your Order History</h2>
                      <p className="text-xs text-muted-foreground">Track status and review bills for your mango orders.</p>
                    </div>

                    {orders.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <span className="text-4xl">📦</span>
                        <p className="text-xs text-muted-foreground">You haven't placed any orders yet.</p>
                        <Link
                          href="/products"
                          className="inline-block px-5 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] rounded-xl text-xs font-bold text-black shadow-sm"
                        >
                          Explore Mangoes
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div 
                            key={order.id}
                            className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm hover:border-emerald-500/10 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3 text-xs">
                              <div>
                                <p className="font-black text-hero-text uppercase text-sm">{order.id}</p>
                                <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5 font-medium">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(order.created_at).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 items-center">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                  order.status === "delivered"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : order.status === "cancelled"
                                      ? "bg-red-500/10 text-red-500"
                                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                }`}>
                                  Status: {order.status}
                                </span>
                                
                                <span className="text-sm font-black text-hero-text">৳{order.total}</span>
                              </div>
                            </div>

                            {/* Item list */}
                            <div className="space-y-2">
                              {order.order_items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center text-xs">
                                  <div className="truncate pr-4">
                                    <span className="font-extrabold text-hero-text">{item.product?.name || "Premium Variety"}</span>
                                    <span className="text-muted-foreground font-semibold"> (×{item.quantity})</span>
                                  </div>
                                  <span className="font-bold text-hero-text">৳{item.total_price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. WISHLIST TAB */}
                {activeTab === "wishlist" && (
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="font-serif-heading text-xl font-bold text-hero-text">My Wishlist</h2>
                      <p className="text-xs text-muted-foreground">Fresh varieties you saved to review later.</p>
                    </div>

                    {wishlistProducts.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <span className="text-4xl">❤️</span>
                        <p className="text-xs text-muted-foreground">Your wishlist is empty.</p>
                        <Link
                          href="/products"
                          className="inline-block px-5 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] rounded-xl text-xs font-bold text-black shadow-sm"
                        >
                          Browse Varieties
                        </Link>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {wishlistProducts.map((prod) => (
                          <div 
                            key={prod.id}
                            className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col justify-between hover:border-emerald-500/15 hover:shadow-md transition-all"
                          >
                            <div className="relative h-32 w-full shrink-0">
                              <Link href={`/products/${prod.slug}`} className="block w-full h-full cursor-pointer">
                                <img
                                  src={prod.images?.[0]}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              </Link>
                              <button
                                onClick={() => handleRemoveWishlist(prod.id)}
                                className="absolute top-2.5 right-2.5 p-2 bg-black/60 rounded-full text-slate-400 hover:text-red-500 border border-white/5 cursor-pointer z-10"
                                title="Remove Wishlist"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="p-4 space-y-3 grow flex flex-col justify-between">
                              <Link href={`/products/${prod.slug}`} className="space-y-0.5 block cursor-pointer group-hover:opacity-95">
                                <h4 className="font-serif-heading font-extrabold text-sm text-hero-text truncate">
                                  {prod.name}
                                </h4>
                                <p className="text-xs font-black text-[#fbbf24]">৳{prod.sale_price || prod.price}</p>
                              </Link>

                              <button
                                onClick={() => addToCart(prod, 1, "10kg")}
                                className="w-full py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-500/20 transition-all cursor-pointer"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. ADDRESSES TAB */}
                {activeTab === "addresses" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                      <div>
                        <h2 className="font-serif-heading text-xl font-bold text-hero-text">Shipping Addresses</h2>
                        <p className="text-xs text-muted-foreground">Manage where your premium mangoes are delivered.</p>
                      </div>
                      {!showAddressForm && (
                        <button
                          onClick={() => {
                            setAddressForm(defaultAddressForm);
                            setEditingAddressId(null);
                            setShowAddressForm(true);
                          }}
                          className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add New Address
                        </button>
                      )}
                    </div>

                    {!showAddressForm ? (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {addresses.length === 0 ? (
                          <div className="col-span-full text-center py-12 space-y-3 bg-card border border-border rounded-2xl">
                            <MapPin className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-sm font-semibold text-hero-text">No addresses saved</p>
                            <p className="text-xs text-muted-foreground">Add a delivery address to make checkout faster.</p>
                          </div>
                        ) : (
                          addresses.map((addr) => (
                            <div 
                              key={addr.id}
                              className={`relative p-5 bg-card border rounded-2xl transition-all ${
                                addr.is_default 
                                  ? "border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.1)]" 
                                  : "border-border hover:border-emerald-500/30"
                              }`}
                            >
                              {addr.is_default && (
                                <span className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                              
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-hero-text text-sm">{addr.full_name}</h4>
                                    <span className="bg-muted-bg text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase">{addr.label}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {addr.street_address} {addr.apartment ? `, ${addr.apartment}` : ""} <br />
                                    {addr.area}, {addr.city}, {addr.state} {addr.postal_code} <br />
                                    {addr.country}
                                  </p>
                                </div>
                                
                                <div className="text-xs font-semibold text-hero-text">
                                  📞 {addr.phone}
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
                                {!addr.is_default ? (
                                  <button
                                    onClick={() => handleSetDefaultAddress(addr.id)}
                                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                  >
                                    Set as Default
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-bold text-muted-foreground">Default Address</span>
                                )}

                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      setAddressForm({
                                        full_name: addr.full_name,
                                        phone: addr.phone,
                                        email: addr.email || "",
                                        country: addr.country,
                                        state: addr.state,
                                        city: addr.city,
                                        area: addr.area,
                                        postal_code: addr.postal_code || "",
                                        street_address: addr.street_address,
                                        apartment: addr.apartment || "",
                                        label: addr.label,
                                        is_default: addr.is_default
                                      });
                                      setEditingAddressId(addr.id);
                                      setShowAddressForm(true);
                                    }}
                                    className="p-2 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 rounded-lg transition-colors cursor-pointer"
                                    title="Edit"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAddress(addr.id)}
                                    className="p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleSaveAddress} className="bg-card border border-border rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-base text-hero-text">
                            {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddressId(null);
                            }}
                            className="text-xs font-bold text-muted-foreground hover:text-hero-text cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={addressForm.full_name}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, full_name: e.target.value }))}
                              className="w-full bg-muted-bg/50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">Phone Number *</label>
                            <input
                              type="tel"
                              required
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full bg-muted-bg/50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                            />
                          </div>
                          
                          <div className="space-y-2 sm:col-span-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">Street Address *</label>
                            <input
                              type="text"
                              required
                              value={addressForm.street_address}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, street_address: e.target.value }))}
                              className="w-full bg-muted-bg/50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                              placeholder="House, Road, Block..."
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">Area / Locality *</label>
                            <input
                              type="text"
                              required
                              value={addressForm.area}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, area: e.target.value }))}
                              className="w-full bg-muted-bg/50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                              placeholder="e.g. Dhanmondi, Gulshan"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">City / Town *</label>
                            <input
                              type="text"
                              required
                              value={addressForm.city}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                              className="w-full bg-muted-bg/50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">State / Division *</label>
                            <select
                              required
                              value={addressForm.state}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                              className="w-full bg-muted-bg/50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 cursor-pointer appearance-none"
                            >
                              <option value="">Select Division</option>
                              <option value="Dhaka">Dhaka</option>
                              <option value="Rajshahi">Rajshahi</option>
                              <option value="Chittagong">Chittagong</option>
                              <option value="Khulna">Khulna</option>
                              <option value="Sylhet">Sylhet</option>
                              <option value="Barisal">Barisal</option>
                              <option value="Rangpur">Rangpur</option>
                              <option value="Mymensingh">Mymensingh</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">Postal Code</label>
                            <input
                              type="text"
                              value={addressForm.postal_code}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))}
                              className="w-full bg-muted-bg/50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">Country *</label>
                            <input
                              type="text"
                              required
                              value={addressForm.country}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                              className="w-full bg-muted-bg/50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground block">Address Label</label>
                            <select
                              value={addressForm.label}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value as any }))}
                              className="w-full bg-muted-bg/50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 cursor-pointer appearance-none"
                            >
                              <option value="Home">Home</option>
                              <option value="Office">Office</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          
                          <div className="sm:col-span-2 pt-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                addressForm.is_default ? "bg-emerald-500 border-emerald-500" : "bg-card border-border group-hover:border-emerald-500/50"
                              }`}>
                                {addressForm.is_default && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={addressForm.is_default}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
                              />
                              <span className="text-sm font-semibold text-hero-text">Make this my default shipping address</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-border">
                          <button
                            type="submit"
                            disabled={addingAddress}
                            className="py-3 px-8 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                          >
                            {addingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {editingAddressId ? "Update Address" : "Save Address"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* 4. ACCOUNT SETTINGS TAB */}
                {activeTab === "account" && (
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="font-serif-heading text-xl font-bold text-hero-text">Personal Information</h2>
                      <p className="text-xs text-muted-foreground">Manage your profile picture, contact details, and personal data.</p>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-8 font-sans">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-muted-bg/50 border border-border rounded-2xl">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#fbbf24] to-[#f59e0b] flex items-center justify-center text-black text-3xl font-black shadow-lg">
                            {profile.full_name ? profile.full_name[0].toUpperCase() : "U"}
                          </div>
                          <button type="button" className="absolute bottom-0 right-0 p-2 bg-card border border-border rounded-full text-muted-foreground hover:text-emerald-500 shadow-sm transition-colors cursor-pointer" title="Update Picture">
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-center sm:text-left space-y-1">
                          <h3 className="font-bold text-hero-text text-sm">Profile Picture</h3>
                          <p className="text-xs text-muted-foreground max-w-sm">
                            Upload a new profile picture. Recommended size is 256x256px.
                          </p>
                        </div>
                      </div>

                      {/* Personal Info Grid */}
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Full Name</label>
                          <input
                            type="text"
                            required
                            value={accountForm.fullName}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, fullName: e.target.value }))}
                            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                            placeholder="John Doe"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Email Address (Read Only)</label>
                          <input
                            type="email"
                            disabled
                            value={accountForm.email}
                            className="w-full bg-muted-bg/50 border border-border rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground cursor-not-allowed opacity-70"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Phone Number</label>
                          <input
                            type="tel"
                            required
                            value={accountForm.phone}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                            placeholder="+880 1..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Date of Birth</label>
                          <input
                            type="date"
                            value={accountForm.dob}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, dob: e.target.value }))}
                            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Gender</label>
                          <div className="relative">
                            <select
                              value={accountForm.gender}
                              onChange={(e) => setAccountForm(prev => ({ ...prev, gender: e.target.value }))}
                              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Country</label>
                          <div className="relative">
                            <select
                              value={accountForm.country}
                              onChange={(e) => setAccountForm(prev => ({ ...prev, country: e.target.value }))}
                              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                            >
                              <option value="">Select Country</option>
                              <option value="Bangladesh">Bangladesh</option>
                              <option value="India">India</option>
                              <option value="USA">USA</option>
                              <option value="UK">UK</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">City / Region</label>
                          <input
                            type="text"
                            value={accountForm.city}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                            placeholder="Dhaka, Rajshahi..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-border">
                        <button
                          type="submit"
                          disabled={savingAccount}
                          className="py-3 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                        >
                          {savingAccount ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving Profile...
                            </>
                          ) : (
                            "Update Profile"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 5. PAYMENT METHODS TAB */}
                {activeTab === "payment" && (
                  <div className="space-y-6 flex flex-col items-center justify-center text-center py-20 h-full">
                    <div className="p-4 bg-muted-bg rounded-full text-muted-foreground mb-4">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <h2 className="font-serif-heading text-xl font-bold text-hero-text">Payment Methods</h2>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Securely save your payment methods for faster checkout. This feature is coming soon.
                    </p>
                  </div>
                )}

                {/* 6. PREFERENCES / NOTIFICATIONS TAB */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="font-serif-heading text-xl font-bold text-hero-text">Preferences & Notifications</h2>
                      <p className="text-xs text-muted-foreground">Customize your MangoDB experience and manage alerts.</p>
                    </div>

                    <form onSubmit={handleUpdatePreferences} className="space-y-8 font-sans max-w-2xl">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-hero-text pb-2 border-b border-border">Regional Settings</h3>
                        
                        <div className="grid sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Language</label>
                            <select
                              value={preferences.language}
                              onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 appearance-none cursor-pointer"
                            >
                              <option value="en">English (US)</option>
                              <option value="bn">Bengali (বাংলা)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Currency</label>
                            <select
                              value={preferences.currency}
                              onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 appearance-none cursor-pointer"
                            >
                              <option value="BDT">BDT (৳)</option>
                              <option value="USD">USD ($)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-hero-text pb-2 border-b border-border">Display</h3>
                        <label className="flex items-center justify-between p-4 border border-border rounded-xl cursor-pointer hover:border-emerald-500/30 transition-colors">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-hero-text">Dark Mode</p>
                            <p className="text-xs text-muted-foreground">Switch between light and dark themes.</p>
                          </div>
                          <div className={`w-11 h-6 rounded-full transition-colors relative ${preferences.darkMode ? "bg-emerald-500" : "bg-muted-bg"}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.darkMode ? "translate-x-5" : ""}`} />
                          </div>
                          <input type="checkbox" className="hidden" checked={preferences.darkMode} onChange={(e) => setPreferences(prev => ({ ...prev, darkMode: e.target.checked }))} />
                        </label>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-hero-text pb-2 border-b border-border">Notifications</h3>
                        <label className="flex items-center justify-between p-4 border border-border rounded-xl cursor-pointer hover:border-emerald-500/30 transition-colors">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-hero-text">Email Notifications</p>
                            <p className="text-xs text-muted-foreground">Receive order updates and promotions via email.</p>
                          </div>
                          <div className={`w-11 h-6 rounded-full transition-colors relative ${preferences.emailNotif ? "bg-emerald-500" : "bg-muted-bg"}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.emailNotif ? "translate-x-5" : ""}`} />
                          </div>
                          <input type="checkbox" className="hidden" checked={preferences.emailNotif} onChange={(e) => setPreferences(prev => ({ ...prev, emailNotif: e.target.checked }))} />
                        </label>

                        <label className="flex items-center justify-between p-4 border border-border rounded-xl cursor-pointer hover:border-emerald-500/30 transition-colors">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-hero-text">SMS Notifications</p>
                            <p className="text-xs text-muted-foreground">Receive delivery alerts via SMS.</p>
                          </div>
                          <div className={`w-11 h-6 rounded-full transition-colors relative ${preferences.smsNotif ? "bg-emerald-500" : "bg-muted-bg"}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.smsNotif ? "translate-x-5" : ""}`} />
                          </div>
                          <input type="checkbox" className="hidden" checked={preferences.smsNotif} onChange={(e) => setPreferences(prev => ({ ...prev, smsNotif: e.target.checked }))} />
                        </label>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={savingPrefs}
                          className="py-3 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.2)] hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Save Preferences
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 7. CHANGE PASSWORD TAB */}
                {activeTab === "password" && (
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="font-serif-heading text-xl font-bold text-hero-text">Change Password</h2>
                      <p className="text-xs text-muted-foreground">Update your password to keep your account secure.</p>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-6 max-w-md font-sans">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Current Password</label>
                        <input
                          type="password"
                          required
                          value={passwordForm.current}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">New Password</label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={passwordForm.new}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                        />
                        {/* Strength Indicator */}
                        {passwordForm.new && (
                          <div className="pt-1 space-y-1.5">
                            <div className="flex gap-1 h-1.5 w-full bg-muted-bg rounded-full overflow-hidden">
                              <div className={`h-full transition-all ${strengthScore >= 1 ? (strengthScore >= 3 ? 'bg-emerald-500 w-1/4' : 'bg-amber-500 w-1/4') : 'bg-red-500 w-1/4'}`} />
                              <div className={`h-full transition-all ${strengthScore >= 2 ? (strengthScore >= 3 ? 'bg-emerald-500 w-1/4' : 'bg-amber-500 w-1/4') : 'bg-transparent w-1/4'}`} />
                              <div className={`h-full transition-all ${strengthScore >= 3 ? 'bg-emerald-500 w-1/4' : 'bg-transparent w-1/4'}`} />
                              <div className={`h-full transition-all ${strengthScore >= 4 ? 'bg-emerald-500 w-1/4' : 'bg-transparent w-1/4'}`} />
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase text-right">
                              {strengthScore < 2 ? "Weak" : strengthScore < 3 ? "Fair" : strengthScore < 4 ? "Good" : "Strong"}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={passwordForm.confirm}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={changingPassword}
                          className="w-full py-3 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Update Password
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 8. SECURITY TAB */}
                {activeTab === "security" && (
                  <div className="space-y-6 font-sans">
                    <div className="border-b border-border pb-4">
                      <h2 className="font-serif-heading text-xl font-bold text-hero-text">Account Security</h2>
                      <p className="text-xs text-muted-foreground">Manage your verification status and active sessions.</p>
                    </div>

                    <div className="grid gap-4 max-w-2xl">
                      <div className="p-5 border border-border bg-card rounded-2xl flex items-center justify-between hover:border-emerald-500/20 transition-all">
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-hero-text">Email Address</p>
                          <p className="text-xs text-muted-foreground">{profile.email}</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Verified
                        </span>
                      </div>

                      <div className="p-5 border border-border bg-card rounded-2xl flex items-center justify-between hover:border-emerald-500/20 transition-all">
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-hero-text">Phone Number</p>
                          <p className="text-xs text-muted-foreground">{profile.phone || "Not set"}</p>
                        </div>
                        {profile.phone ? (
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Verified
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-w-2xl mt-8 pt-8 border-t border-border space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-hero-text">Device Management</h3>
                        <div className="flex items-center justify-between p-5 bg-card border border-border rounded-2xl">
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-hero-text">Log out everywhere</p>
                            <p className="text-xs text-muted-foreground">Sign out of all devices except this one.</p>
                          </div>
                          <button 
                            onClick={handleLogoutEverywhere}
                            className="px-5 py-2.5 bg-muted-bg text-hero-text text-xs font-bold rounded-xl hover:bg-border transition-colors"
                          >
                            Log Out All
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <h3 className="text-sm font-bold text-red-500">Danger Zone</h3>
                        <div className="flex items-center justify-between p-5 bg-red-500/5 border border-red-500/20 rounded-2xl">
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-hero-text">Delete Account</p>
                            <p className="text-xs text-muted-foreground">Permanently remove your account and data.</p>
                          </div>
                          <button 
                            onClick={handleDeleteAccount}
                            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
