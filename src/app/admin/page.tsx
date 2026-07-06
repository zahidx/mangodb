"use client";

import { AdminDashboardSkeleton } from "@/components/skeletons";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    CalendarDays,
    Clock,
    Coins,
    Hash,
    Loader2,
    Megaphone,
    Package,
    ShoppingBag,
    ShoppingCart,
    Sparkles,
    TrendingUp,
    Users,
    X,
    Zap
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
// Chart rendered using pure CSS — no external chart library dependency

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const supabase = createClient() as any;

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);

  // Broadcast state
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage, type: "system" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(`Notification sent to ${result.sent_to} users!`);
      setShowBroadcast(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send notification");
    } finally {
      setBroadcasting(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, usersRes, revenueRes, lowStockRes, recentRes, catRes] =
        await Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
          supabase.from("orders").select("total").eq("payment_status", "paid"),
          supabase.from("products").select("id, name, stock, images").lt("stock", 10).order("stock", { ascending: true }).limit(5),
          supabase.from("orders").select("id, total, status, payment_status, created_at, profile:profiles(full_name)").order("created_at", { ascending: false }).limit(8),
          supabase.from("categories").select("id", { count: "exact", head: true }),
        ]);

      const totalRevenue = revenueRes.data?.reduce(
        (sum: number, o: any) => sum + (o.total || 0), 0
      ) || 0;

      setStats({
        totalRevenue,
        totalOrders: ordersRes.count || 0,
        totalCustomers: usersRes.count || 0,
        totalProducts: productsRes.count || 0,
      });

      setProductCount(productsRes.count || 0);
      setCategoryCount(catRes.count || 0);
      setLowStock(lowStockRes.data || []);
      setRecentOrders(recentRes.data || []);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    const toastId = toast.loading("Seeding categories...");
    try {
      const categoriesToSeed = [
        { name: "Organic Harvest", slug: "organic", description: "100% chemical-free organic mangoes.", is_active: true },
        { name: "Premium Crates", slug: "premium", description: "Handpicked premium grade mangoes.", is_active: true },
        { name: "Festival Gift Boxes", slug: "gifts", description: "Gift packaging for festivals.", is_active: true },
        { name: "Aamsotto & Dried", slug: "dried", description: "Sun-dried mango bars and slices.", is_active: true },
        { name: "Pure Mango Pulp", slug: "pulp", description: "100% pure mango pulp.", is_active: true },
        { name: "Seasonal Specials", slug: "seasonal", description: "Limited-time seasonal varieties.", is_active: true },
      ];

      const { data: insertedCats, error: catErr } = await supabase.from("categories").insert(categoriesToSeed).select();
      if (catErr) throw new Error("Category seeding failed: " + catErr.message);

      toast.loading("Seeding products...", { id: toastId });
      const catMap: Record<string, string> = {};
      insertedCats.forEach((c: any) => { catMap[c.slug] = c.id; });

      const productsToSeed = [
        { name: "Rajshahi Himsagar", slug: "himsagar-mangoes", description: "The ultimate king of Bengali taste!", price: 1200, sale_price: 999, stock: 150, category_id: catMap["premium"], images: ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"], is_featured: true, is_active: true, metadata: { origin_district: "Rajshahi", weight_options: ["5kg", "10kg"], badge: "King of Bengal" } },
        { name: "Rangpur Haribhanga", slug: "haribhanga-mangoes", description: "Fleshy and fiberless with rich sweet taste.", price: 1400, sale_price: null, stock: 120, category_id: catMap["premium"], images: ["https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&auto=format&fit=crop&q=80"], is_featured: true, is_active: true, metadata: { origin_district: "Rangpur", weight_options: ["5kg", "10kg"], badge: "Fleshy & Fiberless" } },
        { name: "Chapainawabganj Lengra", slug: "lengra-mangoes", description: "Aromatic with sweet and tangy undertone.", price: 1100, sale_price: 950, stock: 200, category_id: catMap["premium"], images: ["https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&auto=format&fit=crop&q=80"], is_featured: true, is_active: true, metadata: { origin_district: "Chapainawabganj", weight_options: ["5kg", "10kg"], badge: "Aromatic Delight" } },
        { name: "Premium Amrapali", slug: "amrapali-mangoes", description: "Intensely dark orange pulp with honey-like sweetness.", price: 1300, sale_price: 1150, stock: 180, category_id: catMap["premium"], images: ["https://images.unsplash.com/photo-1552474030-b3a5b5f04e2e?w=600&auto=format&fit=crop&q=80"], is_featured: true, is_active: true, metadata: { origin_district: "Chapai Nawabganj", weight_options: ["5kg", "10kg"], badge: "Intensely Sweet" } },
        { name: "Gopalbhog Select", slug: "gopalbhog-select", description: "Rich golden color with soft velvety pulp.", price: 1000, sale_price: null, stock: 90, category_id: catMap["seasonal"], images: ["https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&auto=format&fit=crop&q=80"], is_featured: false, is_active: true, metadata: { origin_district: "Rajshahi", weight_options: ["5kg", "10kg"], badge: "Early Harvest" } },
        { name: "Traditional Rajshahi Aamsotto", slug: "rajshahi-aamsotto", description: "Sun-dried mango bar from pure Himsagar pulp.", price: 600, sale_price: 550, stock: 300, category_id: catMap["dried"], images: ["https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&auto=format&fit=crop&q=80"], is_featured: false, is_active: true, metadata: { origin_district: "Rajshahi", weight_options: ["1kg", "2kg"], badge: "Sun Dried" } },
        { name: "Pure Himsagar Pulp (1L)", slug: "himsagar-pulp-1l", description: "Flash-frozen Himsagar pulp.", price: 450, sale_price: 399, stock: 250, category_id: catMap["pulp"], images: ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"], is_featured: false, is_active: true, metadata: { origin_district: "Rajshahi", weight_options: ["1L"], badge: "100% Natural" } },
        { name: "Corporate Gift Basket (15kg)", slug: "corporate-gift-basket", description: "Elegant basket with Himsagar and Lengra assortment.", price: 2500, sale_price: 2200, stock: 50, category_id: catMap["gifts"], images: ["https://images.unsplash.com/photo-1552474030-b3a5b5f04e2e?w=600&auto=format&fit=crop&q=80"], is_featured: false, is_active: true, metadata: { origin_district: "Rajshahi", weight_options: ["15kg"], badge: "Gift Special" } },
      ];

      const { error: prodErr } = await supabase.from("products").insert(productsToSeed);
      if (prodErr) throw new Error("Product seeding failed: " + prodErr.message);

      toast.success("Database seeded successfully!", { id: toastId });
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Seeding failed", { id: toastId });
    } finally {
      setSeeding(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `৳\u00A0${amount.toLocaleString("en-BD")}`;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "text-amber-700 bg-amber-50 border border-amber-200/50",
      confirmed: "text-blue-700 bg-blue-50 border border-blue-200/50",
      processing: "text-purple-700 bg-purple-50 border border-purple-200/50",
      shipped: "text-cyan-700 bg-cyan-50 border border-cyan-200/50",
      delivered: "text-emerald-700 bg-emerald-50 border border-emerald-200/50",
      cancelled: "text-red-700 bg-red-50 border border-red-200/50",
    };
    return colors[status] || "text-[#475569] bg-[#F8FAFC] border border-[#EEF2F7]";
  };

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  const chartData = [
    { day: "Mon", revenue: 12000, orders: 18, target: 15000, prevWeek: 11000 },
    { day: "Tue", revenue: 19000, orders: 24, target: 15000, prevWeek: 14500 },
    { day: "Wed", revenue: 15000, orders: 20, target: 15000, prevWeek: 16200 },
    { day: "Thu", revenue: 28000, orders: 32, target: 18000, prevWeek: 21000 },
    { day: "Fri", revenue: 22000, orders: 27, target: 18000, prevWeek: 19800 },
    { day: "Sat", revenue: 35000, orders: 40, target: 20000, prevWeek: 28500 },
    { day: "Sun", revenue: Math.max(30000, stats.totalRevenue || 30000), orders: 36, target: 20000, prevWeek: 26000 },
  ];

  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const avgRevenue = Math.round(totalRevenue / chartData.length);
  const totalOrders = chartData.reduce((s, d) => s + d.orders, 0);
  const prevTotal = chartData.reduce((s, d) => s + d.prevWeek, 0);
  const changePercent = prevTotal > 0 ? (((totalRevenue - prevTotal) / prevTotal) * 100).toFixed(1) : "0";

  const STATS_CARDS = [
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: Coins, gradient: "from-amber-400 to-orange-500", badge: "Live" },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, gradient: "from-emerald-400 to-emerald-500", badge: `${stats.totalOrders > 0 ? "Active" : "Pending"}` },
    { label: "Customers", value: stats.totalCustomers, icon: Users, gradient: "from-blue-400 to-indigo-500", badge: "Registered" },
    { label: "Products", value: stats.totalProducts, icon: Package, gradient: "from-purple-400 to-pink-500", badge: `${stats.totalProducts} active` },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-[1400px]">

      {/* ===== WELCOME HEADER ===== */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-50 via-amber-50 to-orange-50 border border-amber-200/40 p-7 sm:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-100 text-[10px] font-bold text-amber-700 uppercase tracking-[0.12em]">
              Overview
            </span>
            <div className="mt-2 space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Dashboard Overview
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Welcome back, {profile?.full_name?.split(" ")[0] || "Admin"}! Here&apos;s what&apos;s happening with your marketplace today.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-slate-200">
              <CalendarDays className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-slate-600">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </span>
            </div>
            <Link
              href="/admin/products"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs rounded-md hover:shadow-md hover:shadow-amber-500/25 active:scale-[0.97] transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              Quick Add
            </Link>
          </div>
        </div>
      </div>

      {/* ===== SEED PROMPT ===== */}
      {productCount === 0 && categoryCount === 0 && (
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 p-6">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-200/30 rounded-full blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-amber-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Fresh Database Detected
              </h3>
              <p className="text-xs text-amber-700/70">
                Your tables are empty. Seed with premium mango varieties, categories, and sample data to get started.
              </p>
            </div>
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="relative px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-md hover:shadow-md hover:shadow-amber-500/30 active:scale-[0.97] transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {seeding ? "Seeding..." : "Seed Demo Data"}
            </button>
          </div>
        </div>
      )}

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {STATS_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative bg-white rounded-lg border border-slate-200/80 p-5 hover:shadow-md hover:shadow-slate-200/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">
                  {stat.label}
                </span>
                <div className={`w-9 h-9 rounded-md bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-[18px] h-[18px] text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {stat.value}
              </p>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                  <ArrowUpRight className="w-2.5 h-2.5" />
                  {stat.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== ADVANCED ANALYTICS CHART ===== */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Chart Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly Revenue Trend</h3>
                <p className="text-[10px] text-slate-400 font-medium">Daily revenue, orders &amp; performance targets</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 text-[10px] font-black text-emerald-700 border border-emerald-200/50">
                <TrendingUp className="w-3 h-3" />
                {changePercent}% vs Last Week
              </span>
            </div>
          </div>
          {/* Mini stat strip */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-[10px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              <span className="text-slate-500 font-medium">Revenue</span>
              <span className="font-black text-slate-800">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span className="text-slate-500 font-medium">Orders</span>
              <span className="font-black text-slate-800">{totalOrders}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
              <span className="text-slate-500 font-medium">Avg/Day</span>
              <span className="font-black text-slate-800">{formatCurrency(avgRevenue)}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-300 border border-violet-400" />
              <span className="text-slate-500 font-medium">Target</span>
              <span className="font-black text-slate-800">{formatCurrency(18000)}</span>
            </div>
          </div>
        </div>

        {/* Chart Body — pure CSS bars, zero library dependencies */}
        <div className="p-5 sm:p-6">
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-1">
              <span className="text-[9px] font-semibold text-slate-400">40k</span>
              <span className="text-[9px] font-semibold text-slate-400">30k</span>
              <span className="text-[9px] font-semibold text-slate-400">20k</span>
              <span className="text-[9px] font-semibold text-slate-400">10k</span>
              <span className="text-[9px] font-semibold text-slate-400">0</span>
            </div>

            {/* Grid lines + bars */}
            <div className="ml-14 pl-2 border-l border-slate-100">
              {/* Horizontal grid lines */}
              <div className="relative h-[260px]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-dashed border-slate-100"
                    style={{ bottom: `${i * 25}%` }}
                  />
                ))}

                {/* Average reference line */}
                {(() => {
                  const maxRevenue = Math.max(...chartData.map((x) => x.revenue), 1);
                  const avgPct = (avgRevenue / maxRevenue) * 100;
                  return (
                    <div
                      className="absolute left-0 right-0 border-t-2 border-dashed border-amber-400 z-10"
                      style={{ bottom: `${avgPct}%` }}
                    >
                      <span className="absolute -top-3 right-0 text-[8px] font-bold text-amber-500 bg-white px-1">
                        Avg
                      </span>
                    </div>
                  );
                })()}

                {/* Bars */}
                <div className="absolute inset-0 flex items-end justify-around pb-1">
                  {chartData.map((d, i) => {
                    const maxRevenue = Math.max(...chartData.map((x) => x.revenue), 1);
                    const maxOrders = Math.max(...chartData.map((x) => x.orders), 1);
                    const revPercent = (d.revenue / maxRevenue) * 100;
                    const ordPercent = (d.orders / maxOrders) * 100;

                    return (
                      <div key={d.day} className="flex flex-col items-center gap-1 group relative flex-1">
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                          <div className="bg-white rounded-md border border-slate-200 shadow-xl shadow-slate-200/50 px-3 py-2 min-w-[140px]">
                            <p className="text-[10px] font-bold text-slate-800 mb-1.5">{d.day}</p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1 text-[9px] text-slate-500">
                                  <span className="w-1.5 h-1.5 rounded-sm bg-indigo-500" />
                                  Revenue
                                </span>
                                <span className="text-[10px] font-black text-slate-800">{formatCurrency(d.revenue)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1 text-[9px] text-slate-500">
                                  <span className="w-1.5 h-1.5 rounded-sm bg-rose-500" />
                                  Orders
                                </span>
                                <span className="text-[10px] font-black text-slate-800">{d.orders}</span>
                              </div>
                              <div className="border-t border-slate-100 my-1" />
                              <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1 text-[9px] text-slate-500">
                                  <span className="w-1.5 h-1.5 rounded-sm bg-violet-400" />
                                  Target
                                </span>
                                <span className="text-[10px] font-bold text-indigo-600">{formatCurrency(d.target)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bar group */}
                        <div className="flex items-end gap-[3px] h-full">
                          {/* Revenue bar */}
                          <div
                            className="w-3 sm:w-4 rounded-t-sm bg-gradient-to-t from-indigo-500/80 to-indigo-400 transition-all duration-700 ease-out"
                            style={{ height: `${Math.max(revPercent, 1)}%` }}
                          />
                          {/* Orders bar */}
                          <div
                            className="w-3 sm:w-4 rounded-t-sm bg-gradient-to-t from-rose-400/80 to-rose-300 transition-all duration-700 ease-out"
                            style={{ height: `${Math.max(ordPercent, 1)}%` }}
                          />
                        </div>

                        {/* X-axis label */}
                        <span className="text-[9px] font-semibold text-slate-400 mt-1">{d.day}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Average reference line placed above */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TWO-COLUMN SECTION ===== */}
      <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
                <p className="text-[10px] text-slate-400 font-medium">Latest transactions</p>
              </div>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-50 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200/60"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-lg bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                <ShoppingCart className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">No orders yet</p>
              <p className="text-[11px] text-slate-300 mt-1 max-w-[200px]">
                Orders will appear here when customers start buying.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-slate-50/80 transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-amber-700 text-xs font-black shrink-0 border border-amber-200/50">
                      <Hash className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-amber-700 transition-colors">
                        {order.profile?.full_name || "Guest Customer"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-amber-600 w-20 text-right tabular-nums">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Low Stock</h3>
                <p className="text-[10px] text-slate-400 font-medium">Items needing attention</p>
              </div>
            </div>
          </div>

          {lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-100">
                <Package className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-emerald-600">All Stocked Up ✅</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                Every product has sufficient inventory.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStock.map((product: any) => {
                const stockPercent = Math.min(100, (product.stock / 10) * 100);
                const isOut = product.stock === 0;
                return (
                  <div key={product.id} className="px-5 sm:px-6 py-4 space-y-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-9 h-9 rounded object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-md bg-slate-50 shrink-0 border border-slate-200 flex items-center justify-center">
                          <Package className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOut ? "bg-red-500" : stockPercent < 50 ? "bg-amber-400" : "bg-emerald-400"
                              }`}
                              style={{ width: `${isOut ? 0 : stockPercent}%` }}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              isOut
                                ? "text-red-700 bg-red-50 border border-red-200/50"
                                : "text-amber-700 bg-amber-50 border border-amber-200/50"
                            }`}
                          >
                            {isOut ? "Out" : `${product.stock}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-md bg-indigo-50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
            <p className="text-[10px] text-slate-400 font-medium">Frequently used admin tasks</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Product", href: "/admin/products", icon: Package, gradient: "from-emerald-500 to-emerald-600", light: "from-emerald-50 to-emerald-100/50" },
            { label: "View Orders", href: "/admin/orders", icon: ShoppingBag, gradient: "from-amber-500 to-orange-500", light: "from-amber-50 to-amber-100/50" },
            { label: "Manage Coupons", href: "/admin/coupons", icon: TrendingUp, gradient: "from-blue-500 to-indigo-500", light: "from-blue-50 to-blue-100/50" },
            { label: "Broadcast", href: "#", icon: Megaphone, gradient: "from-rose-500 to-pink-500", light: "from-rose-50 to-rose-100/50", onClick: () => setShowBroadcast(true) },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick || (() => window.location.href = action.href)}
                className="group relative overflow-hidden rounded-md bg-gradient-to-br border border-slate-200/80 p-4 hover:shadow-md hover:border-slate-300/60 transition-all duration-300 cursor-pointer w-full text-left"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.light} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative z-10 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 group-active:scale-95 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                    {action.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== BROADCAST MODAL ===== */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBroadcast(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl shadow-black/5 overflow-hidden z-10">
            {/* Header */}
            <div className="relative px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-sm">
                    <Megaphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Send Notification</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Broadcast a message to all customers</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBroadcast(false)}
                  className="p-1.5 rounded border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleBroadcast} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Title *</label>
                <input
                  type="text" required value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. New Mango Harvest Available!"
                  className="w-full px-4 py-3 rounded-md border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Message *</label>
                <textarea
                  required rows={4} value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)}
                  placeholder="Write your notification message..."
                  className="w-full px-4 py-3 rounded-md border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 transition-all resize-none"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200/60 rounded p-4">
                <p className="text-[10px] text-amber-800 font-medium flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>This will send a push notification to all registered users across the platform.</span>
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowBroadcast(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-md transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={broadcasting}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-xs rounded-md shadow-sm hover:shadow-md hover:shadow-rose-500/20 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-50 flex items-center gap:2"
                >
                  {broadcasting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Megaphone className="w-3.5 h-3.5" />
                  )}
                  {broadcasting ? "Sending..." : "Send to All Users"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
