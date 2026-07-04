"use client";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import { getUserOrders } from "@/lib/supabase/queries";
import type { Order, Product, UserAddress } from "@/types/database";
import {
    ArrowRight,
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
import React, { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from "recharts";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading, logout, refreshSession } = useAuth();
  const { addToCart } = useCart();
  const supabase = createClient() as any;

  const initialTab = (searchParams.get("tab") as any) || "overview";
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "wishlist" | "addresses" | "account" | "payment" | "notifications" | "password" | "security">(initialTab);
  const [orderTab, setOrderTab] = useState<'active' | 'past'>('active');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
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

  // Payment form
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentForm, setPaymentForm] = useState({
    provider: "card",
    account_details: "",
    is_default: false
  });
  const [addingPayment, setAddingPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);

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
      let allOrders: any[] = [];
      const localOrders = JSON.parse(localStorage.getItem("mangodb-orders") || "[]");
      allOrders = [...localOrders];

      const orderRes = await getUserOrders(profile.id);
      if (orderRes.data) {
        const existingIds = new Set(allOrders.map(o => o.id));
        const dbOrders = orderRes.data.filter((o: any) => !existingIds.has(o.id));
        allOrders = [...allOrders, ...dbOrders];
      }
      
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(allOrders);

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
        try {
          const res = await fetch("/api/user/addresses");
          const json = await res.json();
          if (json.data) setAddresses(json.data);
        } catch (e) {
          console.error("Failed to fetch addresses from API");
        }
      } else {
        const storedAddresses = localStorage.getItem(`mangodb-addresses-${profile.id}`);
        if (storedAddresses) setAddresses(JSON.parse(storedAddresses));
      }

      // 4. Load Notifications
      if (!profile.id.startsWith("demo-")) {
        try {
          const res = await fetch("/api/user/notifications");
          const json = await res.json();
          if (json.data) setNotifications(json.data);
        } catch (e) {
          console.error("Failed to fetch notifications from API");
        }
      } else {
        const storedNotifs = localStorage.getItem(`mangodb-notifications-${profile.id}`);
        if (storedNotifs) setNotifications(JSON.parse(storedNotifs));
      }

      // 5. Load Saved Payment Methods
      if (!profile.id.startsWith("demo-")) {
        try {
          const res = await fetch("/api/user/payment-methods");
          const json = await res.json();
          if (json.data) setPaymentMethods(json.data);
        } catch (e) {
          console.error("Failed to fetch payment methods from API");
        }
      } else {
        const storedPayments = localStorage.getItem(`mangodb-payments-${profile.id}`);
        if (storedPayments) setPaymentMethods(JSON.parse(storedPayments));
      }

    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!profile) return;
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      if (!profile.id.startsWith("demo-")) {
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
        
        // Add Notification
        await supabase.from("notifications").insert({
          user_id: profile.id,
          title: "Order Cancelled",
          message: `Your order #${orderId} has been cancelled successfully.`,
          type: "order_cancelled"
        });

      } else {
        const storedOrders = JSON.parse(localStorage.getItem("mangodb-orders") || "[]");
        const updatedOrders = storedOrders.map((o: any) => o.id === orderId ? { ...o, status: "cancelled" } : o);
        localStorage.setItem("mangodb-orders", JSON.stringify(updatedOrders));

        const storedNotifs = JSON.parse(localStorage.getItem(`mangodb-notifications-${profile.id}`) || "[]");
        const newNotif = {
          id: `notif-${Date.now()}`,
          user_id: profile.id,
          title: "Order Cancelled",
          message: `Your order #${orderId} has been cancelled successfully.`,
          type: "order_cancelled",
          is_read: false,
          created_at: new Date().toISOString()
        };
        localStorage.setItem(`mangodb-notifications-${profile.id}`, JSON.stringify([newNotif, ...storedNotifs]));
        setNotifications(prev => [newNotif, ...prev]);
      }
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
      toast.success("Order cancelled");
    } catch (err) {
      toast.error("Failed to cancel order");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingAccount(true);

    try {
      if (!profile.id.startsWith("demo-")) {
        const payload = {
          full_name: accountForm.fullName,
          phone: accountForm.phone,
          dob: accountForm.dob || null,
          gender: accountForm.gender || null,
          country: accountForm.country || null,
          city: accountForm.city || null,
        };

        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
           throw new Error("Failed to update via API");
        }
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
          await fetch("/api/user/addresses", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, id: editingAddressId })
          });
        } else {
          await fetch("/api/user/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }

        try {
          const res = await fetch("/api/user/addresses");
          const json = await res.json();
          if (json.data) setAddresses(json.data);
        } catch (e) {
          console.error("Failed to fetch updated addresses");
        }
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

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setAddingPayment(true);
    
    try {
      const newMethod = {
        user_id: profile.id,
        provider: paymentForm.provider,
        account_details: paymentForm.account_details,
        is_default: paymentMethods.length === 0 ? true : paymentForm.is_default
      };

      if (!profile.id.startsWith("demo-")) {
        if (newMethod.is_default) {
          await supabase.from("user_payment_methods").update({ is_default: false }).eq("user_id", profile.id);
        }
        await supabase.from("user_payment_methods").insert(newMethod);
        
        const { data: payments } = await supabase
          .from("user_payment_methods")
          .select("*")
          .eq("user_id", profile.id)
          .order("is_default", { ascending: false });
        if (payments) setPaymentMethods(payments);
      } else {
        const updated = [...paymentMethods, { ...newMethod, id: `pm-${Date.now()}` }];
        if (newMethod.is_default) {
          updated.forEach(p => { p.is_default = p.id === updated[updated.length - 1].id; });
        }
        setPaymentMethods(updated);
        localStorage.setItem(`mangodb-payments-${profile.id}`, JSON.stringify(updated));
      }
      
      toast.success("Payment method added");
      setShowPaymentForm(false);
      setPaymentForm({ provider: "card", account_details: "", is_default: false });
    } catch (err) {
      toast.error("Failed to add payment method");
    } finally {
      setAddingPayment(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!profile) return;
    if (!confirm("Remove this payment method?")) return;
    
    try {
      if (!profile.id.startsWith("demo-")) {
        await supabase.from("user_payment_methods").delete().eq("id", id);
        setPaymentMethods(paymentMethods.filter(p => p.id !== id));
      } else {
        const updated = paymentMethods.filter(p => p.id !== id);
        setPaymentMethods(updated);
        localStorage.setItem(`mangodb-payments-${profile.id}`, JSON.stringify(updated));
      }
      toast.success("Payment method removed");
    } catch (err) {
      toast.error("Failed to remove payment method");
    }
  };

  const handleSetDefaultPayment = async (id: string) => {
    if (!profile) return;
    try {
      if (!profile.id.startsWith("demo-")) {
        await supabase.from("user_payment_methods").update({ is_default: true }).eq("id", id);
        await supabase.from("user_payment_methods").update({ is_default: false }).neq("id", id).eq("user_id", profile.id);
        const { data: payments } = await supabase
          .from("user_payment_methods")
          .select("*")
          .eq("user_id", profile.id)
          .order("is_default", { ascending: false });
        if (payments) setPaymentMethods(payments);
      } else {
        const updated = paymentMethods.map(p => ({ ...p, is_default: p.id === id }));
        setPaymentMethods(updated);
        localStorage.setItem(`mangodb-payments-${profile.id}`, JSON.stringify(updated));
      }
      toast.success("Default payment method updated");
    } catch (err) {
      toast.error("Failed to update default payment method");
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

  // Prepare Spend Data for Chart
  const spendData = React.useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const monthlySpend: Record<string, number> = {};
    
    // Initialize last 6 months to 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      monthlySpend[monthName] = 0;
    }

    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        const d = new Date(order.created_at);
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        if (monthlySpend[monthName] !== undefined) {
          monthlySpend[monthName] += (order.total || 0);
        }
      }
    });

    return Object.keys(monthlySpend).map(month => ({
      name: month,
      spend: monthlySpend[month],
    }));
  }, [orders]);

  // Prepare Order Status Data for Pie Chart
  const statusData = React.useMemo(() => {
    if (!orders || orders.length === 0) return [];
    let pending = 0;
    let delivered = 0;
    let cancelled = 0;
    
    orders.forEach(order => {
      if (["pending", "processing", "shipped"].includes(order.status)) {
        pending++;
      } else if (order.status === 'delivered') {
        delivered++;
      } else if (order.status === 'cancelled') {
        cancelled++;
      }
    });
    
    return [
      { name: 'Active', value: pending, color: '#F59E0B' }, // amber-500
      { name: 'Delivered', value: delivered, color: '#10B981' }, // emerald-500
      { name: 'Cancelled', value: cancelled, color: '#F43F5E' }, // rose-500
    ].filter(item => item.value > 0);
  }, [orders]);


  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background text-[#0F172A] dark:text-foreground selection:bg-[#fbbf24] selection:text-black">
      
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Fixed on the left) */}
      <aside className={`fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-gray-200 z-40 flex flex-col shadow-sm transition-transform duration-300 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:flex`}>
        
        {/* Logo area */}
        <div className="h-[72px] flex items-center px-6 border-b border-gray-100 shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-4.5 h-4.5 text-gray-900" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">Mango<span className="text-emerald-600">DB</span></span>
          </Link>
        </div>

        {/* User area */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-linear-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 text-lg font-black shrink-0">
            {profile.full_name ? profile.full_name[0].toUpperCase() : "U"}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-gray-900 text-sm truncate">{profile.full_name}</h3>
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider truncate">{profile.role} account</p>
          </div>
        </div>

        {/* Nav Tabs list */}
        <nav className="grow overflow-y-auto py-5 px-3 space-y-0.5">
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
                onClick={() => {
                  setActiveTab(item.id as any);
                  router.push(`/dashboard?tab=${item.id}`, { scroll: false });
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer group ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "scale-110" : "group-hover:scale-110"} transition-transform`} />
                <span>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom area (Logout) */}
        <div className="p-3 border-t border-gray-100 shrink-0">
          <button
            onClick={() => {
              logout();
              setIsSidebarOpen(false);
              toast.success("Logged out successfully");
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer text-red-500 hover:bg-red-50 group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:pl-[280px] min-h-screen flex flex-col bg-gray-50 relative w-full">
        
        {/* Header (Top Nav for Dashboard) */}
        <header className="h-[72px] bg-white border-b border-gray-200 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 capitalize">
              {activeTab === "overview" ? "Dashboard" : activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <Link href="/" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Store &rarr;
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="grow p-6 sm:p-10 lg:p-12 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            
            {loadingData ? (
              <div className="h-96 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                <p className="text-xs text-gray-500 font-medium">Loading your dashboard...</p>
              </div>
            ) : (
              <div className="grow flex flex-col">
                {/* 0. OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div className="flex flex-col gap-6">
                      
                      {/* Dashboard Stats */}
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        
                        {/* Total Orders */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-500" />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</span>
                          </div>
                          <h4 className="font-bold text-2xl text-gray-900">{orders.length}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">All orders placed</p>
                        </div>
                        
                        {/* Pending Orders */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Active</span>
                          </div>
                          <h4 className="font-bold text-2xl text-gray-900">
                            {orders.filter(o => ["pending", "processing", "shipped"].includes(o.status)).length}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">Awaiting delivery</p>
                        </div>

                        {/* Completed Orders */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Done</span>
                          </div>
                          <h4 className="font-bold text-2xl text-gray-900">
                            {orders.filter(o => o.status === "delivered").length}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">Delivered successfully</p>
                        </div>

                        {/* Wishlist */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                              <Heart className="w-5 h-5 text-rose-500" />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Saved</span>
                          </div>
                          <h4 className="font-bold text-2xl text-gray-900">{wishlistProducts.length}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Items in wishlist</p>
                        </div>

                        {/* Saved Addresses */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Saved</span>
                          </div>
                          <h4 className="font-bold text-2xl text-gray-900">{addresses.length}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Delivery addresses</p>
                        </div>

                      </div>

                      {/* Welcome Card */}
                      <div className="bg-linear-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                        <div className="flex items-start gap-4 relative z-10">
                          <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0 backdrop-blur-sm">
                            <User className="w-7 h-7" />
                          </div>
                          <div className="text-white">
                            <h3 className="font-bold text-xl">Welcome back, {profile.full_name?.split(' ')[0]}!</h3>
                            <p className="text-emerald-100 text-sm mt-1 max-w-lg leading-relaxed">
                              Your personalized dashboard is ready. Track orders, manage addresses, and update your account.
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 relative z-10">
                          <button onClick={() => { setActiveTab('orders'); router.push('/dashboard?tab=orders', { scroll: false }); }} className="w-full sm:w-auto px-5 py-2.5 bg-white text-emerald-700 font-bold rounded-lg hover:bg-emerald-50 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
                            View Orders
                            <Package className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Charts Section */}
                      <div className="grid lg:grid-cols-3 gap-6">
                        
                        {/* Spending Chart */}
                        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900">Spending Overview</h3>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg font-medium">Last 6 months</span>
                          </div>
                          <div className="h-[280px] w-full">
                            {spendData.length > 0 && spendData.some(d => d.spend > 0) ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={spendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" className="dark:opacity-10" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `৳${value}`} />
                                  <RechartsTooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                    formatter={(value: any) => [`৳${value}`, "Spent"]}
                                  />
                                  <Area type="monotone" dataKey="spend" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center flex-col gap-3 text-muted-foreground">
                                <Package className="w-8 h-8 opacity-20" />
                                <p className="text-sm font-semibold">No spending data available yet.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Breakdown Chart */}
                        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-6">
                          <h3 className="font-bold text-gray-900 mb-6">Order Status</h3>
                          <div className="h-[300px] w-full relative">
                            {statusData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    {statusData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center flex-col gap-3 text-muted-foreground">
                                <Package className="w-8 h-8 opacity-20" />
                                <p className="text-sm font-semibold">No orders found.</p>
                              </div>
                            )}
                            {/* Custom Legend */}
                            {statusData.length > 0 && (
                              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 flex-wrap">
                                {statusData.map((entry, index) => (
                                  <div key={`legend-${index}`} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                    <span className="text-xs font-bold text-[#475569] dark:text-muted-foreground">{entry.name} ({entry.value})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                )}

                {/* 1. ORDERS TAB */}
                {activeTab === "orders" && (() => {
                  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
                  const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
                  const displayOrders = orderTab === 'active' ? activeOrders : pastOrders;
                  
                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Your Orders</h2>
                          <p className="text-sm text-gray-500 mt-0.5">Track and manage all your mango orders</p>
                        </div>
                      </div>

                      {/* Tabs Navigation */}
                      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                        <button 
                          onClick={() => setOrderTab('active')}
                          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                            orderTab === 'active' 
                              ? 'bg-white text-gray-900 shadow-sm' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Active
                          <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                            orderTab === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {activeOrders.length}
                          </span>
                        </button>
                        
                        <button 
                          onClick={() => setOrderTab('past')}
                          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                            orderTab === 'past' 
                              ? 'bg-white text-gray-900 shadow-sm' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Past
                          <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                            orderTab === 'past' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {pastOrders.length}
                          </span>
                        </button>
                      </div>

                      {displayOrders.length === 0 ? (
                        <div className="text-center py-20 bg-transparent space-y-4">
                          <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                            <Package className="w-10 h-10" />
                          </div>
                          <h3 className="text-xl font-bold text-hero-text">No {orderTab === 'active' ? 'Active' : 'Past'} Orders Found</h3>
                          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            {orderTab === 'active' 
                              ? "You don't have any ongoing deliveries right now." 
                              : "You haven't completed any orders yet."}
                          </p>
                          {orderTab === 'active' && (
                            <div className="pt-6">
                              <Link href="/products" className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md transition-all shadow-md hover:shadow-lg">
                                Start Shopping
                              </Link>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full">
                          {/* Table Header (Desktop Only) */}
                          <div className="hidden lg:flex items-center w-full bg-gray-50 rounded-lg px-4 py-2.5 mb-2">
                            <div className="w-10 shrink-0 text-center text-[10px] font-semibold uppercase text-gray-400 tracking-wider">#</div>
                            <div className="flex-1 min-w-0 grid grid-cols-12 gap-4">
                              <div className="col-span-3 text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Product</div>
                              <div className="col-span-2 text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Order ID</div>
                              <div className="col-span-3 text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Delivery</div>
                              <div className="col-span-1 text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Payment</div>
                              <div className="col-span-1 text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Amount</div>
                              <div className="col-span-2 text-[10px] font-semibold uppercase text-gray-400 tracking-wider text-right pr-2">Action</div>
                            </div>
                          </div>

                          {/* Table Body */}
                          <div className="flex flex-col gap-2">
                            {displayOrders.map((order, index) => (
                              <div 
                                key={order.id} 
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
                                  
                                  {/* Numbering */}
                                  <div className="hidden lg:flex w-10 shrink-0 justify-center">
                                    <span className="text-sm font-bold text-gray-300 font-mono">
                                      {String(index + 1).padStart(2, '0')}
                                    </span>
                                  </div>

                                  {/* 1. Product Summary */}
                                  <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
                                    <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                                      <img 
                                        src={order.order_items?.[0]?.product?.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&auto=format&fit=crop&q=80"} 
                                        alt="Order Item" 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                        {order.order_items?.[0]?.product?.name || "Premium Mango Crate"}
                                      </h3>
                                      <p className="text-xs text-gray-400 truncate mt-0.5">
                                        {order.order_items?.map((item: any) => `${item.quantity}x ${item.product?.name || ""}`).join(", ")}
                                      </p>
                                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                        order.status === "delivered" ? "bg-emerald-50 text-emerald-700" :
                                        order.status === "cancelled" ? "bg-red-50 text-red-600" :
                                        "bg-amber-50 text-amber-700"
                                      }`}>
                                        {order.status?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Pending"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* 2. Order Details */}
                                  <div className="lg:col-span-2">
                                    <p className="font-semibold text-gray-900 text-sm font-mono">#{order.id}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                  </div>

                                  {/* 3. Delivery Info */}
                                  <div className="lg:col-span-3 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm capitalize truncate">{order.shipping_address?.full_name}</p>
                                    <p className="text-xs text-gray-400 truncate">{order.shipping_address?.address_line_1}</p>
                                  </div>

                                  {/* 4. Payment */}
                                  <div className="lg:col-span-1">
                                    <p className="font-semibold text-gray-900 text-sm uppercase">{order.payment_method || "COD"}</p>
                                    <p className={`text-xs font-medium ${order.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                      {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                                    </p>
                                  </div>

                                  {/* 5. Amount */}
                                  <div className="lg:col-span-1">
                                    <span className="text-lg font-bold text-gray-900">৳{order.total}</span>
                                  </div>

                                  {/* 6. Action */}
                                  <div className="lg:col-span-2 flex items-center justify-end gap-2">
                                    {orderTab === 'active' && order.status === 'pending' && (
                                      <button
                                        onClick={() => handleCancelOrder(order.id)}
                                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-all text-xs"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <Link 
                                      href={`/track?id=${order.id}`}
                                      className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all text-xs flex items-center gap-1.5"
                                    >
                                      {orderTab === 'past' ? 'Details' : 'Track'}
                                      <ArrowRight className="w-3 h-3" />
                                    </Link>
                                  </div>

                                </div>
                              <div className="lg:hidden mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-lg font-bold text-gray-900">৳{order.total}</span>
                                <div className="flex gap-2">
                                  {orderTab === 'active' && order.status === 'pending' && (
                                    <button onClick={() => handleCancelOrder(order.id)} className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-lg text-xs">Cancel</button>
                                  )}
                                  <Link href={`/track?id=${order.id}`} className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1">
                                    {orderTab === 'past' ? 'Details' : 'Track'} <ArrowRight className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 2. WISHLIST TAB */}
                {activeTab === "wishlist" && (
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="font-serif-heading text-xl font-bold text-hero-text">My Wishlist</h2>
                      <p className="text-xs text-muted-foreground">Fresh varieties you saved to review later.</p>
                    </div>

                    {wishlistProducts.length === 0 ? (
                      <div className="text-center py-20 bg-white dark:bg-card border border-border rounded-md shadow-sm space-y-4">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
                          <span className="text-4xl">❤️</span>
                        </div>
                        <h3 className="text-xl font-bold text-hero-text">Your Wishlist is Empty</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          Keep track of your favorite mango varieties by adding them to your wishlist.
                        </p>
                        <div className="pt-4">
                          <Link
                            href="/products"
                            className="inline-flex px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md shadow-sm transition-all"
                          >
                            Explore Mangoes
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wishlistProducts.map((prod) => (
                          <div 
                            key={prod.id}
                            className="group bg-white dark:bg-card border border-border rounded-md overflow-hidden flex flex-col hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300"
                          >
                            <div className="relative aspect-[4/3] w-full shrink-0 bg-muted overflow-hidden">
                              <Link href={`/products/${prod.slug}`} className="block w-full h-full cursor-pointer">
                                <img
                                  src={prod.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80"}
                                  alt={prod.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80" }}
                                />
                              </Link>
                              <button
                                onClick={() => handleRemoveWishlist(prod.id)}
                                className="absolute top-3 right-3 p-2.5 bg-white/95 dark:bg-black/80 backdrop-blur-md rounded-md text-slate-400 hover:text-rose-600 shadow-sm transition-all opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0"
                                title="Remove from Wishlist"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="p-5 flex flex-col flex-grow justify-between gap-5">
                              <Link href={`/products/${prod.slug}`} className="block cursor-pointer">
                                <h4 className="font-serif-heading font-extrabold text-base text-hero-text line-clamp-1 mb-1.5 group-hover:text-emerald-600 transition-colors">
                                  {prod.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[15px] font-black text-emerald-600 dark:text-emerald-400">
                                    ৳{prod.sale_price || prod.price}
                                  </span>
                                  {prod.sale_price && prod.sale_price < prod.price && (
                                    <span className="text-xs font-semibold text-muted-foreground line-through">
                                      ৳{prod.price}
                                    </span>
                                  )}
                                </div>
                              </Link>

                              <button
                                onClick={() => addToCart(prod, 1, "10kg")}
                                className="w-full py-2.5 bg-[#0F172A] hover:bg-emerald-600 text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white rounded-md text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                              >
                                <ShoppingBag className="w-4 h-4" />
                                Move to Cart
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
                          className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add New Address
                        </button>
                      )}
                    </div>

                    {!showAddressForm ? (
                      <div className="flex flex-col gap-4">
                        {addresses.length === 0 ? (
                          <div className="text-center py-16 px-4 bg-white dark:bg-card border border-[#EEF2F7] dark:border-border/50 rounded-md shadow-sm">
                            <h3 className="text-lg font-bold text-[#0F172A] dark:text-hero-text mb-2">No addresses saved</h3>
                            <p className="text-sm text-[#475569] dark:text-muted-foreground">Add a delivery address to ensure a seamless checkout experience.</p>
                          </div>
                        ) : (
                          addresses.map((addr) => (
                            <div 
                              key={addr.id}
                              className={`relative p-5 sm:p-6 bg-white dark:bg-card rounded-md transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${
                                addr.is_default 
                                  ? "border-2 border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)]" 
                                  : "border border-[#EEF2F7] dark:border-border/50 hover:border-[#CBD5E1] dark:hover:border-border hover:shadow-sm"
                              }`}
                            >
                              <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h4 className="font-bold text-[#0F172A] dark:text-hero-text text-base truncate max-w-[200px] sm:max-w-xs">{addr.full_name}</h4>
                                  <span className="bg-[#F8FAFC] dark:bg-muted-bg border border-[#EEF2F7] dark:border-border/50 text-[#475569] dark:text-muted-foreground px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">{addr.label}</span>
                                  {addr.is_default && (
                                    <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-[#475569] dark:text-muted-foreground leading-relaxed pr-4">
                                  {addr.street_address}{addr.apartment ? `, ${addr.apartment}` : ""}, {addr.area}, {addr.city}, {addr.state} {addr.postal_code}, {addr.country}
                                </p>
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-foreground">
                                  <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                  {addr.phone}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 pt-4 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-[#EEF2F7] dark:border-border/50">
                                {!addr.is_default && (
                                  <button
                                    onClick={() => handleSetDefaultAddress(addr.id)}
                                    className="text-xs font-bold text-[#475569] dark:text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mr-auto sm:mr-4"
                                  >
                                    Set Default
                                  </button>
                                )}

                                <div className={`flex items-center gap-2 ${addr.is_default ? 'ml-auto sm:ml-0' : ''}`}>
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
                                    className="p-2.5 text-[#475569] dark:text-muted-foreground bg-[#F8FAFC] dark:bg-muted-bg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md transition-all"
                                    title="Edit"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAddress(addr.id)}
                                    className="p-2.5 text-[#475569] dark:text-muted-foreground bg-[#F8FAFC] dark:bg-muted-bg hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-all"
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
                      <form onSubmit={handleSaveAddress} className="bg-white dark:bg-card border border-[#EEF2F7] dark:border-border/50 rounded-md p-6 sm:p-8 space-y-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:shadow">
                        <div className="mb-2.5">
                          <h3 className="text-xl font-bold text-[#0F172A] dark:text-hero-text">
                            {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                          </h3>
                          <p className="text-xs text-[#475569] dark:text-muted-foreground mt-1">Please provide accurate details to ensure smooth delivery.</p>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#475569] dark:text-muted-foreground uppercase tracking-wider block">Full Name <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              required
                              value={addressForm.full_name}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, full_name: e.target.value }))}
                              className="w-full bg-white dark:bg-muted-bg/20 border border-[#EEF2F7] dark:border-border/50 rounded-md px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:border-emerald-500/30"
                              placeholder="e.g. John Doe"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#475569] dark:text-muted-foreground uppercase tracking-wider block">Phone Number <span className="text-rose-500">*</span></label>
                            <input
                              type="tel"
                              required
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full bg-white dark:bg-muted-bg/20 border border-[#EEF2F7] dark:border-border/50 rounded-md px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:border-emerald-500/30"
                              placeholder="+880 1712-345678"
                            />
                          </div>
                          
                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[11px] font-semibold text-[#475569] dark:text-muted-foreground uppercase tracking-wider block">Street Address <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              required
                              value={addressForm.street_address}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, street_address: e.target.value }))}
                              className="w-full bg-white dark:bg-muted-bg/20 border border-[#EEF2F7] dark:border-border/50 rounded-md px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:border-emerald-500/30"
                              placeholder="House No, Road No, Block/Sector"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#475569] dark:text-muted-foreground uppercase tracking-wider block">Area / Locality <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              required
                              value={addressForm.area}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, area: e.target.value }))}
                              className="w-full bg-white dark:bg-muted-bg/20 border border-[#EEF2F7] dark:border-border/50 rounded-md px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:border-emerald-500/30"
                              placeholder="e.g. Dhanmondi, Gulshan"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#475569] dark:text-muted-foreground uppercase tracking-wider block">City / Town <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              required
                              value={addressForm.city}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                              className="w-full bg-white dark:bg-muted-bg/20 border border-[#EEF2F7] dark:border-border/50 rounded-md px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:border-emerald-500/30"
                              placeholder="e.g. Dhaka"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#475569] dark:text-muted-foreground uppercase tracking-wider block">State / Division <span className="text-rose-500">*</span></label>
                            <div className="relative">
                              <select
                                required
                                value={addressForm.state}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                                className="w-full bg-white dark:bg-muted-bg/20 border border-[#EEF2F7] dark:border-border/50 rounded-md px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-foreground transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:border-emerald-500/30 appearance-none cursor-pointer"
                              >
                                <option value="" disabled>Select Division</option>
                                <option value="Dhaka">Dhaka</option>
                                <option value="Rajshahi">Rajshahi</option>
                                <option value="Chittagong">Chittagong</option>
                                <option value="Khulna">Khulna</option>
                                <option value="Sylhet">Sylhet</option>
                                <option value="Barisal">Barisal</option>
                                <option value="Rangpur">Rangpur</option>
                                <option value="Mymensingh">Mymensingh</option>
                              </select>
                              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#475569] dark:text-muted-foreground uppercase tracking-wider block">Postal Code</label>
                            <input
                              type="text"
                              value={addressForm.postal_code}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))}
                              className="w-full bg-white dark:bg-muted-bg/20 border border-[#EEF2F7] dark:border-border/50 rounded-md px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:border-emerald-500/30"
                              placeholder="e.g. 1212"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#475569] dark:text-muted-foreground uppercase tracking-wider block">Country <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              required
                              value={addressForm.country}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                              className="w-full bg-[#F8FAFC] dark:bg-muted/30 border border-[#EEF2F7] dark:border-border/50 rounded-md px-4 py-3 text-sm font-semibold text-[#475569] dark:text-muted-foreground cursor-not-allowed"
                              readOnly
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#475569] dark:text-muted-foreground uppercase tracking-wider block">Address Label</label>
                            <div className="relative">
                              <select
                                value={addressForm.label}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value as any }))}
                                className="w-full bg-white dark:bg-muted-bg/20 border border-[#EEF2F7] dark:border-border/50 rounded-md px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-foreground transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:border-emerald-500/30 appearance-none cursor-pointer"
                              >
                                <option value="Home">Home</option>
                                <option value="Office">Office</option>
                                <option value="Other">Other</option>
                              </select>
                              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                              </div>
                            </div>
                          </div>
                          
                          <div className="sm:col-span-2 pt-2">
                            <label className="flex items-center gap-3 cursor-pointer group w-max">
                              <div className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ${
                                addressForm.is_default 
                                  ? "bg-emerald-600 border border-emerald-600 shadow-sm" 
                                  : "bg-white dark:bg-card border border-[#CBD5E1] dark:border-border group-hover:border-emerald-500/50"
                              }`}>
                                {addressForm.is_default && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <span className="text-sm font-semibold text-[#0F172A] dark:text-foreground select-none">Make this my default shipping address</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-[#EEF2F7] dark:border-border/50 mt-8">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddressId(null);
                            }}
                            className="py-3 px-6 bg-white dark:bg-card hover:bg-[#F8FAFC] dark:hover:bg-muted-bg text-[#0F172A] dark:text-foreground text-sm font-bold rounded-md border border-[#EEF2F7] dark:border-border/50 transition-all cursor-pointer flex-1 sm:flex-none text-center"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={addingAddress}
                            className="py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-md shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98] flex-1 sm:flex-none"
                          >
                            {addingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {editingAddressId ? "Update Address" : "Save Address"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* 3B. PAYMENT METHODS TAB */}
                {activeTab === "payment" && (
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="font-serif-heading text-xl font-bold text-hero-text">Payment Methods</h2>
                        <p className="text-xs text-muted-foreground">Manage your saved cards and mobile banking details.</p>
                      </div>
                      {!showPaymentForm && (
                        <button
                          onClick={() => {
                            setPaymentForm({ provider: "card", account_details: "", is_default: false });
                            setShowPaymentForm(true);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md shadow-sm transition-all flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Payment Method
                        </button>
                      )}
                    </div>

                    {!showPaymentForm ? (
                      <div className="flex flex-col gap-4">
                        {paymentMethods.length === 0 ? (
                          <div className="text-center py-16 px-4 bg-white dark:bg-card border border-[#EEF2F7] dark:border-border/50 rounded-md shadow-sm">
                            <h3 className="text-lg font-bold text-[#0F172A] dark:text-hero-text mb-2">No payment methods saved</h3>
                            <p className="text-sm text-[#475569] dark:text-muted-foreground">Add a payment method for faster checkout.</p>
                          </div>
                        ) : (
                          paymentMethods.map((method) => (
                            <div 
                              key={method.id}
                              className={`relative p-5 sm:p-6 bg-white dark:bg-card rounded-md transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${
                                method.is_default 
                                  ? "border-2 border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)]" 
                                  : "border border-[#EEF2F7] dark:border-border/50 hover:border-[#CBD5E1] dark:hover:border-border hover:shadow-sm"
                              }`}
                            >
                              <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h4 className="font-bold text-[#0F172A] dark:text-hero-text text-base capitalize">{method.provider}</h4>
                                  <span className="bg-[#F8FAFC] dark:bg-muted-bg border border-[#EEF2F7] dark:border-border/50 text-[#475569] dark:text-muted-foreground px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider shrink-0">
                                    {method.account_details}
                                  </span>
                                  {method.is_default && (
                                    <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                      Default
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 pt-4 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-[#EEF2F7] dark:border-border/50">
                                {!method.is_default && (
                                  <button
                                    onClick={() => handleSetDefaultPayment(method.id)}
                                    className="text-xs font-bold text-[#475569] dark:text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mr-auto sm:mr-4"
                                  >
                                    Set Default
                                  </button>
                                )}

                                <div className={`flex items-center gap-2 ${method.is_default ? 'ml-auto sm:ml-0' : ''}`}>
                                  <button
                                    onClick={() => handleDeletePaymentMethod(method.id)}
                                    className="p-2.5 text-[#475569] dark:text-muted-foreground bg-[#F8FAFC] dark:bg-muted-bg hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-all"
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
                      <form onSubmit={handleSavePaymentMethod} className="bg-white dark:bg-card border border-[#EEF2F7] dark:border-border/50 rounded-md p-6 sm:p-8 space-y-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:shadow-none">
                        <div>
                          <h3 className="font-bold text-lg text-[#0F172A] dark:text-hero-text">
                            Add New Payment Method
                          </h3>
                          <p className="text-xs text-[#475569] dark:text-muted-foreground mt-1">Add your preferred payment option.</p>
                        </div>
                        
                        <div className="grid gap-x-6 gap-y-5">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#475569] dark:text-muted-foreground uppercase tracking-wider block">Provider <span className="text-rose-500">*</span></label>
                            <div className="relative">
                              <select
                                required
                                value={paymentForm.provider}
                                onChange={(e) => setPaymentForm(prev => ({ ...prev, provider: e.target.value }))}
                                className="w-full bg-white dark:bg-muted-bg/20 border border-[#EEF2F7] dark:border-border/50 rounded-md px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-foreground transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:border-emerald-500/30 appearance-none cursor-pointer"
                              >
                                <option value="card">Credit / Debit Card</option>
                                <option value="bkash">bKash</option>
                                <option value="nagad">Nagad</option>
                                <option value="gpay">Google Pay</option>
                              </select>
                              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#475569] dark:text-muted-foreground uppercase tracking-wider block">Account Details (Number or Card Last 4) <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              required
                              value={paymentForm.account_details}
                              onChange={(e) => setPaymentForm(prev => ({ ...prev, account_details: e.target.value }))}
                              className="w-full bg-white dark:bg-muted-bg/20 border border-[#EEF2F7] dark:border-border/50 rounded-md px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:border-emerald-500/30"
                              placeholder={paymentForm.provider === 'card' ? "e.g. **** **** **** 4242" : "e.g. 01712345678"}
                            />
                          </div>

                          <div className="pt-2">
                            <label className="flex items-center gap-3 cursor-pointer group w-max">
                              <div className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ${
                                paymentForm.is_default 
                                  ? "bg-emerald-600 border border-emerald-600 shadow-sm" 
                                  : "bg-white dark:bg-card border border-[#CBD5E1] dark:border-border group-hover:border-emerald-500/50"
                              }`}>
                                {paymentForm.is_default && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={paymentForm.is_default}
                                onChange={(e) => setPaymentForm(prev => ({ ...prev, is_default: e.target.checked }))}
                              />
                              <span className="text-sm font-semibold text-[#0F172A] dark:text-foreground select-none">Make this my default payment method</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-[#EEF2F7] dark:border-border/50 mt-8">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPaymentForm(false);
                            }}
                            className="py-3 px-6 bg-white dark:bg-card hover:bg-[#F8FAFC] dark:hover:bg-muted-bg text-[#0F172A] dark:text-foreground text-sm font-bold rounded-md border border-[#EEF2F7] dark:border-border/50 transition-all cursor-pointer flex-1 sm:flex-none text-center"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={addingPayment}
                            className="py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-md shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98] flex-1 sm:flex-none"
                          >
                            {addingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Save Payment Method
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

                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-8 font-sans">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-muted-bg/50 border border-border rounded-md shadow-sm">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-md bg-gradient-to-tr from-[#fbbf24] to-[#f59e0b] flex items-center justify-center text-black text-3xl font-black shadow-md">
                            {profile.full_name ? profile.full_name[0].toUpperCase() : "U"}
                          </div>
                          <button type="button" className="absolute -bottom-2 -right-2 p-1.5 bg-card border border-border rounded-md text-muted-foreground hover:text-emerald-500 shadow-sm transition-colors cursor-pointer" title="Update Picture">
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
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Full Name</label>
                          <input
                            type="text"
                            required
                            value={accountForm.fullName}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, fullName: e.target.value }))}
                            className="w-full bg-card border border-border rounded-md px-3.5 py-2.5 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all shadow-sm"
                            placeholder="John Doe"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Email Address (Read Only)</label>
                          <input
                            type="email"
                            disabled
                            value={accountForm.email}
                            className="w-full bg-muted-bg/50 border border-border rounded-md px-3.5 py-2.5 text-sm font-semibold text-muted-foreground cursor-not-allowed opacity-70 shadow-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Phone Number</label>
                          <input
                            type="tel"
                            required
                            value={accountForm.phone}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-card border border-border rounded-md px-3.5 py-2.5 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all shadow-sm"
                            placeholder="+880 1..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Date of Birth</label>
                          <input
                            type="date"
                            value={accountForm.dob}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, dob: e.target.value }))}
                            className="w-full bg-card border border-border rounded-md px-3.5 py-2.5 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all shadow-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Gender</label>
                          <div className="relative">
                            <select
                              value={accountForm.gender}
                              onChange={(e) => setAccountForm(prev => ({ ...prev, gender: e.target.value }))}
                              className="w-full bg-card border border-border rounded-md px-3.5 py-2.5 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer shadow-sm"
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

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Country</label>
                          <div className="relative">
                            <select
                              value={accountForm.country}
                              onChange={(e) => setAccountForm(prev => ({ ...prev, country: e.target.value }))}
                              className="w-full bg-card border border-border rounded-md px-3.5 py-2.5 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer shadow-sm"
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

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">City / Region</label>
                          <input
                            type="text"
                            value={accountForm.city}
                            onChange={(e) => setAccountForm(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full bg-card border border-border rounded-md px-3.5 py-2.5 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all shadow-sm"
                            placeholder="Dhaka, Rajshahi..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-border">
                        <button
                          type="submit"
                          disabled={savingAccount}
                          className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-md shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
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

                {/* 6. PREFERENCES / NOTIFICATIONS TAB */}
                {activeTab === "notifications" && (
                  <div className="space-y-12 max-w-4xl">
                    
                    {/* Notifications Section */}
                    <div className="flex flex-col gap-6">
                      <div className="border-b border-border pb-4 flex justify-between items-end">
                        <div>
                          <h2 className="font-serif-heading text-2xl font-bold text-hero-text flex items-center gap-2">
                            <Bell className="w-6 h-6 text-emerald-600" />
                            Recent Notifications
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1 mb-2.5">Stay updated on your orders and account activity.</p>
                        </div>
                        {notifications.length > 0 && (
                          <button
                            onClick={async () => {
                              if (!profile) return;
                              if (!profile.id.startsWith("demo-")) {
                                await supabase.from("notifications").update({ is_read: true }).eq("user_id", profile.id);
                              }
                              setNotifications(notifications.map(n => ({ ...n, is_read: true })));
                              localStorage.setItem(`mangodb-notifications-${profile.id}`, JSON.stringify(notifications.map(n => ({ ...n, is_read: true }))));
                            }}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-md transition-colors"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-card border-2 border-border border-dashed rounded-md text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-muted-bg flex items-center justify-center mb-4">
                              <Bell className="w-8 h-8 text-slate-300 dark:text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-bold text-hero-text mb-2">No notifications yet</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                              When you have updates about your orders, deliveries, or account activity, they will appear right here.
                            </p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className={`p-5 rounded-md border flex gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${notif.is_read ? 'bg-white dark:bg-card border-border shadow-sm' : 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]'}`}>
                              <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${
                                notif.type === 'order_placed' ? 'bg-blue-100 text-blue-600' :
                                notif.type === 'order_cancelled' ? 'bg-rose-100 text-rose-600' :
                                'bg-emerald-100 text-emerald-600'
                              }`}>
                                <Bell className="w-5 h-5" />
                              </div>
                              <div className="space-y-1 flex-grow">
                                <div className="flex justify-between items-start gap-4">
                                  <h4 className="text-sm font-bold text-hero-text">{notif.title}</h4>
                                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap bg-muted-bg px-2 py-1 rounded-md">
                                    {new Date(notif.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                              </div>
                              {!notif.is_read && (
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 animate-pulse" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Preferences Section */}
                    <div className="space-y-6 pt-6 border-t border-border">
                      <div className="border-b border-border pb-4">
                        <h2 className="font-serif-heading text-2xl font-bold text-hero-text flex items-center gap-2">
                          <Settings className="w-6 h-6 text-emerald-600" />
                          Display & Notification Settings
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1 mb-2.5">Customize how MangoDB looks and communicates with you.</p>
                      </div>

                      <form onSubmit={handleUpdatePreferences} className="flex flex-col gap-6 font-sans">
                        
                        {/* Regional Settings */}
                        <div className="bg-white dark:bg-card border border-border rounded-md overflow-hidden shadow-sm">
                          <div className="p-4 bg-muted-bg/50 border-b border-border">
                            <h3 className="text-sm font-bold text-hero-text">Regional Preferences</h3>
                          </div>
                          <div className="p-6 grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase text-muted-foreground tracking-wider block">Language</label>
                              <div className="relative">
                                <select
                                  value={preferences.language}
                                  onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                                  className="w-full bg-white dark:bg-card border border-border rounded-md px-4 py-3 text-sm font-bold text-hero-text focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer transition-colors"
                                >
                                  <option value="en">English (US)</option>
                                  <option value="bn">Bengali (বাংলা)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase text-muted-foreground tracking-wider block">Currency</label>
                              <div className="relative">
                                <select
                                  value={preferences.currency}
                                  onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                                  className="w-full bg-white dark:bg-card border border-border rounded-md px-4 py-3 text-sm font-bold text-hero-text focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer transition-colors"
                                >
                                  <option value="BDT">BDT (৳)</option>
                                  <option value="USD">USD ($)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Visual & Comm Toggles */}
                        <div className="bg-white dark:bg-card border border-border rounded-md overflow-hidden shadow-sm">
                          <div className="p-4 bg-muted-bg/50 border-b border-border">
                            <h3 className="text-sm font-bold text-hero-text">Visuals & Communication</h3>
                          </div>
                          
                          <div className="divide-y divide-border">
                            {/* Dark Mode Toggle */}
                            <label className="flex items-center justify-between p-6 cursor-pointer hover:bg-muted-bg/30 transition-colors">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-hero-text">Dark Mode Interface</p>
                                <p className="text-xs text-muted-foreground">Switch the platform theme to a darker, low-light aesthetic.</p>
                              </div>
                              <div className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${preferences.darkMode ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`}>
                                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${preferences.darkMode ? "translate-x-5" : ""}`} />
                              </div>
                              <input type="checkbox" className="hidden" checked={preferences.darkMode} onChange={(e) => setPreferences(prev => ({ ...prev, darkMode: e.target.checked }))} />
                            </label>

                            {/* Email Alerts Toggle */}
                            <label className="flex items-center justify-between p-6 cursor-pointer hover:bg-muted-bg/30 transition-colors">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-hero-text">Email Notifications</p>
                                <p className="text-xs text-muted-foreground">Receive critical order updates and tracking links directly to your inbox.</p>
                              </div>
                              <div className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${preferences.emailNotif ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`}>
                                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${preferences.emailNotif ? "translate-x-5" : ""}`} />
                              </div>
                              <input type="checkbox" className="hidden" checked={preferences.emailNotif} onChange={(e) => setPreferences(prev => ({ ...prev, emailNotif: e.target.checked }))} />
                            </label>

                            {/* SMS Alerts Toggle */}
                            <label className="flex items-center justify-between p-6 cursor-pointer hover:bg-muted-bg/30 transition-colors">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-hero-text">SMS Delivery Alerts</p>
                                <p className="text-xs text-muted-foreground">Get real-time text messages when your mangoes are out for delivery.</p>
                              </div>
                              <div className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${preferences.smsNotif ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`}>
                                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${preferences.smsNotif ? "translate-x-5" : ""}`} />
                              </div>
                              <input type="checkbox" className="hidden" checked={preferences.smsNotif} onChange={(e) => setPreferences(prev => ({ ...prev, smsNotif: e.target.checked }))} />
                            </label>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            disabled={savingPrefs}
                            className="py-3 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-md shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Save Preferences
                          </button>
                        </div>
                      </form>
                    </div>
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
                          className="w-full bg-card border border-border rounded-md px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
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
                          className="w-full bg-card border border-border rounded-md px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
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
                          className="w-full bg-card border border-border rounded-md px-4 py-3 text-sm font-semibold text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={changingPassword}
                          className="w-full py-3 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-md shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                      <div className="p-5 border border-border bg-card rounded-md flex items-center justify-between hover:border-emerald-500/20 transition-all">
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-hero-text">Email Address</p>
                          <p className="text-xs text-muted-foreground">{profile.email}</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Verified
                        </span>
                      </div>

                      <div className="p-5 border border-border bg-card rounded-md flex items-center justify-between hover:border-emerald-500/20 transition-all">
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
                        <div className="flex items-center justify-between p-5 bg-card border border-border rounded-md">
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-hero-text">Log out everywhere</p>
                            <p className="text-xs text-muted-foreground">Sign out of all devices except this one.</p>
                          </div>
                          <button 
                            onClick={handleLogoutEverywhere}
                            className="px-5 py-2.5 bg-muted-bg text-hero-text text-xs font-bold rounded-md hover:bg-border transition-colors"
                          >
                            Log Out All
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <h3 className="text-sm font-bold text-red-500">Danger Zone</h3>
                        <div className="flex items-center justify-between p-5 bg-red-500/5 border border-red-500/20 rounded-md">
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-hero-text">Delete Account</p>
                            <p className="text-xs text-muted-foreground">Permanently remove your account and data.</p>
                          </div>
                          <button 
                            onClick={handleDeleteAccount}
                            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-md transition-colors shadow-sm"
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
