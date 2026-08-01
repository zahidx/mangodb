"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getUserOrders } from "@/lib/supabase/queries";
import { ArrowRight, Calendar, FileText, Loader2, Package, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const { profile, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  useEffect(() => {
    async function loadOrders() {
      try {
        let allOrders: any[] = [];
        
        // 1. Load from local storage (for guests & logged-in users)
        const localOrders = JSON.parse(localStorage.getItem("mangobite-orders") || "[]");
        allOrders = [...localOrders];

        // 2. Load from database if authenticated
        if (profile) {
          const res = await getUserOrders(profile.id);
          if (res.data) {
            // merge, avoiding duplicates by id
            const existingIds = new Set(allOrders.map(o => o.id));
            const dbOrders = res.data.filter((o: any) => !existingIds.has(o.id));
            allOrders = [...allOrders, ...dbOrders];
          }
        }

        // Sort by date descending
        allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(allOrders);
      } catch (err) {
        console.error("Failed to load orders", err);
        toast.error("Failed to load your orders.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadOrders();
    }
  }, [profile, authLoading]);

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const handleReorder = (order: any) => {
    const items = order.order_items || [];
    if (items.length === 0) {
      toast.error("No items to reorder");
      return;
    }
    
    let addedCount = 0;
    items.forEach((item: any) => {
      if (item.product) {
        addToCart(
          {
            ...item.product,
            sale_price: item.product.sale_price || item.product.price,
          },
          item.quantity,
          item.selected_weight || "10kg",
          false // Don't show toast for each item
        );
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`${addedCount} item${addedCount > 1 ? "s" : ""} added to cart!`);
    } else {
      toast.error("Could not reorder — product details missing");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAF9] dark:bg-background text-foreground flex flex-col font-sans">
      <Navbar />


      <div className="grow w-full px-4 sm:px-6 lg:px-8 pt-32 pb-12 relative z-0">
        {loading || authLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <p className="text-muted-foreground font-medium">Retrieving your orders...</p>
          </div>
        ) : (
          <div className="w-full">
            
            {/* Tabs Navigation */}
            <div className="flex items-center gap-6 border-b border-border/60 mb-6">
              <button 
                onClick={() => setActiveTab('active')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'active' 
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                    : 'border-transparent text-[#6A8B7D] dark:text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Active Orders
                <span className={`px-2 py-0.5 rounded-full text-[10px] transition-colors ${
                  activeTab === 'active' 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {activeOrders.length}
                </span>
              </button>
              
              <button 
                onClick={() => setActiveTab('past')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'past' 
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                    : 'border-transparent text-[#6A8B7D] dark:text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Past Orders
                <span className={`px-2 py-0.5 rounded-full text-[10px] transition-colors ${
                  activeTab === 'past' 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                    : 'bg-[#5C736A] text-white dark:bg-muted dark:text-muted-foreground'
                }`}>
                  {pastOrders.length}
                </span>
              </button>
            </div>

            {displayOrders.length === 0 ? (
              <div className="text-center py-20 bg-transparent space-y-4">
                <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <Package className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-hero-text">No {activeTab === 'active' ? 'Active' : 'Past'} Orders Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {activeTab === 'active' 
                    ? "You don't have any ongoing deliveries right now." 
                    : "You haven't completed any orders yet."}
                </p>
                {activeTab === 'active' && (
                  <div className="pt-6">
                    <Link href="/products" className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg">
                      Start Shopping
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full">
                {/* Table Header (Desktop Only) */}
                <div className="hidden lg:flex items-center w-full border-b border-border/60 px-2 py-4 mb-2">
                  <div className="w-14 shrink-0 text-center text-[10px] font-black uppercase text-[#5C736A] dark:text-muted-foreground tracking-wider">NO.</div>
                  <div className="flex-1 min-w-0 grid grid-cols-12 gap-4">
                    <div className="col-span-4 text-[10px] font-black uppercase text-[#5C736A] dark:text-muted-foreground tracking-wider">Product Information</div>
                    <div className="col-span-2 text-[10px] font-black uppercase text-[#5C736A] dark:text-muted-foreground tracking-wider">Order ID & Date</div>
                    <div className="col-span-2 text-[10px] font-black uppercase text-[#5C736A] dark:text-muted-foreground tracking-wider">Delivery Details</div>
                    <div className="col-span-1 text-[10px] font-black uppercase text-[#5C736A] dark:text-muted-foreground tracking-wider">Payment</div>
                    <div className="col-span-1 text-[10px] font-black uppercase text-[#5C736A] dark:text-muted-foreground tracking-wider text-left">Amount</div>
                    <div className="col-span-2 text-[10px] font-black uppercase text-[#5C736A] dark:text-muted-foreground tracking-wider text-left pl-1">Action</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="flex flex-col">
                  {displayOrders.map((order, index) => (
                    <div 
                      key={order.id} 
                      className="flex flex-col lg:flex-row overflow-hidden w-full transition-all duration-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] border-b border-border/60 group"
                    >
                      {/* Main Row Content */}
                      <div className="py-5 px-2 flex-1 flex items-center w-full relative">
                        
                        {/* Mobile Numbering Badge */}
                        <div className="lg:hidden absolute top-4 right-3 bg-[#F3F6F4] dark:bg-white/5 text-[#6A8B7D] dark:text-muted-foreground font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                          #{String(index + 1).padStart(2, '0')}
                        </div>

                        {/* Desktop Numbering */}
                        <div className="hidden lg:flex w-14 shrink-0 justify-center">
                          <span className="text-[13px] font-black text-[#A0B3AA] dark:text-muted-foreground/40 font-mono group-hover:text-emerald-500/60 transition-colors">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 w-full items-center">
                          
                          {/* 1. Product Summary (col-span-4) */}
                          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-4">
                            <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/50 relative shadow-sm">
                              <img 
                                src={order.order_items?.[0]?.product?.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&auto=format&fit=crop&q=80"} 
                                alt="Order Item" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <h3 className="font-bold text-hero-text text-sm leading-tight truncate">
                                {order.order_items?.[0]?.product?.name || "Premium Mango Crate"}
                              </h3>
                              <p className="text-[11px] font-semibold text-[#6A8B7D] dark:text-muted-foreground truncate">
                                {order.order_items?.map((item: any) => `${item.quantity}x ${item.product?.name || "Variety"}`).join(", ")}
                              </p>
                              <div className="pt-0.5">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                  order.status === "delivered" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" :
                                  order.status === "cancelled" ? "bg-red-50 text-red-500 dark:bg-red-500/10" :
                                  "bg-[#FFF3D6] text-[#F59E0B] dark:bg-amber-500/10 dark:text-amber-400"
                                }`}>
                                  {order.status || "Pending"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 2. Order Details (col-span-2) */}
                          <div className="lg:col-span-2 space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5 lg:hidden">Order</p>
                            <p className="font-bold text-hero-text text-[13px] uppercase break-words break-all lg:break-normal pr-2">#{order.id}</p>
                            <p className="text-[11px] font-medium text-[#6A8B7D] dark:text-muted-foreground flex items-center gap-1.5 pt-0.5">
                              <Calendar className="w-3.5 h-3.5 opacity-70" />
                              {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>

                          {/* 3. Delivery Info (col-span-2) */}
                          <div className="lg:col-span-2 space-y-0.5">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5 lg:hidden">Delivery To</p>
                            <p className="font-bold text-hero-text text-sm capitalize truncate">{order.shipping_address?.full_name}</p>
                            <p className="text-[11px] font-medium text-[#6A8B7D] dark:text-muted-foreground truncate">{order.shipping_address?.address_line_1}</p>
                          </div>

                          {/* 4. Payment Info (col-span-1) */}
                          <div className="lg:col-span-1 space-y-0.5">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5 lg:hidden">Payment</p>
                            <p className="font-bold text-hero-text text-sm uppercase">{order.payment_method || "COD"}</p>
                            <p className={`text-[11px] font-bold ${order.payment_status === 'paid' || order.payment_method === 'COD' ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {order.payment_status === 'paid' || order.payment_method === 'COD' ? 'Verified' : 'Pending'}
                            </p>
                          </div>

                          {/* 5. Amount (col-span-1) */}
                          <div className="lg:col-span-1 flex flex-col justify-center text-left pt-4 sm:pt-0 border-t sm:border-t-0 border-border/60">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5 lg:hidden">Amount</p>
                            <span className="text-xl font-black text-hero-text leading-none tracking-tight">৳&nbsp;{order.total}</span>
                          </div>

                          {/* 6. Action (col-span-2) */}
                          <div className="lg:col-span-2 flex flex-wrap items-center gap-3 justify-start pr-0 mt-3 lg:mt-0">
                            {activeTab === 'past' && (
                              <button
                                onClick={() => handleReorder(order)}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-emerald-200 bg-white dark:bg-transparent text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-bold rounded-full transition-all text-[11px] whitespace-nowrap cursor-pointer shadow-sm"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Reorder
                              </button>
                            )}
                            <Link
                              href={`/invoice/${order.id}?download=true`}
                              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-black/5 dark:border-white/10 bg-[#FAFAFA] dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm hover:border-black/10 font-bold rounded-full transition-all text-[11px] whitespace-nowrap"
                            >
                              <FileText className="w-3.5 h-3.5 opacity-70" />
                              Invoice
                            </Link>
                            <Link 
                              href={`/track?id=${order.id}`}
                              className="w-full lg:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-all shadow-[0_4px_12px_rgba(5,150,105,0.2)] hover:shadow-[0_6px_16px_rgba(5,150,105,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-1.5 text-[11px] whitespace-nowrap"
                            >
                              {activeTab === 'past' ? 'View Details' : 'Track'} <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>

                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
