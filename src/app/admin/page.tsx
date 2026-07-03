"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  ShoppingCart,
  Coins,
  Users,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  Clock,
  Sparkles,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

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

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Fetch all stats in parallel
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

  // Database seeder for empty state
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
    `৳${amount.toLocaleString("en-BD")}`;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "text-yellow-400 bg-yellow-400/10",
      confirmed: "text-blue-400 bg-blue-400/10",
      processing: "text-purple-400 bg-purple-400/10",
      shipped: "text-cyan-400 bg-cyan-400/10",
      delivered: "text-emerald-400 bg-emerald-400/10",
      cancelled: "text-red-400 bg-red-400/10",
    };
    return colors[status] || "text-white/50 bg-white/5";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Welcome header */}
      <div>
        <h2 className="font-serif-heading text-2xl font-black text-white">
          Welcome back, {profile?.full_name || "Admin"} 👋
        </h2>
        <p className="text-sm text-white/40 mt-1">
          Here's what's happening with your mango marketplace today.
        </p>
      </div>

      {/* Seed prompt for empty database */}
      {productCount === 0 && categoryCount === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Fresh Database Detected
            </h3>
            <p className="text-xs text-white/50">
              Your tables are empty. Seed with premium mango varieties, categories, and sample data?
            </p>
          </div>
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {seeding ? "Seeding..." : "Seed Demo Data"}
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: Coins, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Customers", value: stats.totalCustomers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Products", value: stats.totalProducts, icon: Package, color: "text-purple-400", bg: "bg-purple-400/10" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-3 hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-black ${stat.color}`}>
              {stat.value}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400/70 font-semibold">
              <ArrowUpRight className="w-3 h-3" />
              <span>Live from Supabase</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/30" />
              <h3 className="text-sm font-bold text-white/80">Recent Orders</h3>
            </div>
            <span className="text-[10px] font-bold text-white/30 uppercase">
              Last 8
            </span>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-10 text-center text-white/30 text-sm">
              No orders yet. They'll appear here when customers start ordering.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 text-xs font-bold shrink-0">
                      #
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white/80 truncate">
                        {order.profile?.full_name || "Customer"}
                      </p>
                      <p className="text-[10px] text-white/30">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs font-black text-amber-400 w-20 text-right">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400/60" />
              <h3 className="text-sm font-bold text-white/80">Low Stock</h3>
            </div>
          </div>

          {lowStock.length === 0 ? (
            <div className="p-10 text-center text-white/30 text-sm">
              All products are well-stocked! ✅
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {lowStock.map((product: any) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/[0.06] shrink-0" />
                    )}
                    <p className="text-xs font-bold text-white/70 truncate">
                      {product.name}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-black px-2 py-1 rounded-lg ${
                      product.stock === 0
                        ? "text-red-400 bg-red-400/10"
                        : "text-yellow-400 bg-yellow-400/10"
                    }`}
                  >
                    {product.stock === 0 ? "Out" : `${product.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white/80 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Product", href: "/admin/products", icon: Package, color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400" },
            { label: "View Orders", href: "/admin/orders", icon: ShoppingCart, color: "from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400" },
            { label: "Manage Coupons", href: "/admin/coupons", icon: TrendingUp, color: "from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400" },
            { label: "View Reports", href: "/admin/reports", icon: TrendingUp, color: "from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400" },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-br ${action.color} border text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
