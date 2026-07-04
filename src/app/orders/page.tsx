"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Calendar, ArrowRight, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { getUserOrders } from "@/lib/supabase/queries";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const { profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  useEffect(() => {
    async function loadOrders() {
      try {
        let allOrders: any[] = [];
        
        // 1. Load from local storage (for guests & logged-in users)
        const localOrders = JSON.parse(localStorage.getItem("mangodb-orders") || "[]");
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <div className="bg-card border-b border-border min-h-[280px] pt-20 px-4 sm:px-8 xl:px-12 2xl:px-24 shadow-sm relative z-10 flex flex-col justify-center items-center">
        <div className="w-full max-w-3xl mx-auto text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-hero-text font-serif-heading tracking-tight">Your Orders</h1>
          <p className="text-sm text-muted-foreground font-medium">Review your past mango crates, track current deliveries, and manage your history.</p>
        </div>
      </div>

      <div className="grow w-full px-4 sm:px-6 lg:px-8 py-12 relative z-0">
        {loading || authLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <p className="text-muted-foreground font-medium">Retrieving your orders...</p>
          </div>
        ) : (
          <div className="w-full">
            
            {/* Tabs Navigation */}
            <div className="flex items-center gap-6 border-b border-border mb-6">
              <button 
                onClick={() => setActiveTab('active')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'active' 
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-500' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Active Orders
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeTab === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted'
                }`}>
                  {activeOrders.length}
                </span>
              </button>
              
              <button 
                onClick={() => setActiveTab('past')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'past' 
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-500' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Past Orders
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  activeTab === 'past' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted'
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
                <div className="hidden lg:flex items-center w-full border-b-2 border-border/80 px-2 py-3">
                  <div className="w-12 shrink-0 text-center text-[10px] font-black uppercase text-muted-foreground tracking-wider">No.</div>
                  <div className="flex-1 min-w-0 grid grid-cols-12 gap-4">
                    <div className="col-span-4 text-[10px] font-black uppercase text-muted-foreground tracking-wider">Product Information</div>
                    <div className="col-span-2 text-[10px] font-black uppercase text-muted-foreground tracking-wider">Order ID & Date</div>
                    <div className="col-span-2 text-[10px] font-black uppercase text-muted-foreground tracking-wider">Delivery Details</div>
                    <div className="col-span-1 text-[10px] font-black uppercase text-muted-foreground tracking-wider">Payment</div>
                    <div className="col-span-1 text-[10px] font-black uppercase text-muted-foreground tracking-wider text-right">Amount</div>
                    <div className="col-span-2 text-[10px] font-black uppercase text-muted-foreground tracking-wider text-right pr-4">Action</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="flex flex-col">
                  {displayOrders.map((order, index) => (
                    <div 
                      key={order.id} 
                      className="flex flex-col lg:flex-row overflow-hidden w-full transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.03] group border-b border-border"
                    >
                      {/* Main Row Content */}
                      <div className="py-4 px-2 flex-1 flex items-center w-full relative">
                        
                        {/* Mobile Numbering Badge */}
                        <div className="lg:hidden absolute top-4 right-2 bg-muted/60 text-muted-foreground font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                          #{String(index + 1).padStart(2, '0')}
                        </div>

                        {/* Desktop Numbering */}
                        <div className="hidden lg:flex w-12 shrink-0 justify-center">
                          <span className="text-sm font-black text-muted-foreground/40 font-mono group-hover:text-emerald-500/60 transition-colors">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 w-full items-center">
                          
                          {/* 1. Product Summary (col-span-4) */}
                          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                            <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted border border-border relative">
                              <img 
                                src={order.order_items?.[0]?.product?.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&auto=format&fit=crop&q=80"} 
                                alt="Order Item" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <h3 className="font-bold text-hero-text text-sm leading-tight truncate">
                                {order.order_items?.[0]?.product?.name || "Premium Mango Crate"}
                              </h3>
                              <p className="text-[11px] font-semibold text-muted-foreground truncate">
                                {order.order_items?.map((item: any) => `${item.quantity}x ${item.product?.name || "Variety"}`).join(", ")}
                              </p>
                              <div className="pt-0.5">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  order.status === "delivered" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                  order.status === "cancelled" ? "bg-red-500/10 text-red-500" :
                                  "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                }`}>
                                  {order.status || "Pending"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 2. Order Details (col-span-2) */}
                          <div className="lg:col-span-2 space-y-0.5">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5 lg:hidden">Order</p>
                            <p className="font-bold text-hero-text text-sm uppercase">#{order.id}</p>
                            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 pt-0.5">
                              <Calendar className="w-3 h-3" />
                              {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>

                          {/* 3. Delivery Info (col-span-2) */}
                          <div className="lg:col-span-2 space-y-0.5">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5 lg:hidden">Delivery To</p>
                            <p className="font-bold text-hero-text text-sm capitalize truncate">{order.shipping_address?.full_name}</p>
                            <p className="text-[11px] font-medium text-muted-foreground truncate">{order.shipping_address?.address_line_1}</p>
                          </div>

                          {/* 4. Payment Info (col-span-1) */}
                          <div className="lg:col-span-1 space-y-0.5">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5 lg:hidden">Payment</p>
                            <p className="font-bold text-hero-text text-sm uppercase">{order.payment_method || "COD"}</p>
                            <p className={`text-[11px] font-bold ${order.payment_status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {order.payment_status === 'paid' ? 'Verified' : 'Pending'}
                            </p>
                          </div>

                          {/* 5. Amount (col-span-1) */}
                          <div className="lg:col-span-1 flex flex-col justify-center text-left lg:text-right pt-4 sm:pt-0 border-t sm:border-t-0 border-border">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5 lg:hidden">Amount</p>
                            <span className="text-lg font-black text-hero-text">৳&nbsp;{order.total}</span>
                          </div>

                          {/* 6. Action (col-span-2) */}
                          <div className="lg:col-span-2 flex justify-start lg:justify-end pr-0 lg:pr-4">
                            <Link 
                              href={`/track?id=${order.id}`}
                              className="w-full lg:w-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 text-[11px] whitespace-nowrap"
                            >
                              {activeTab === 'past' ? 'View Details' : 'Track'} <ArrowRight className="w-3 h-3" />
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
