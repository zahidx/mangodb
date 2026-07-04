"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  PackageCheck,
  PackageOpen,
  CheckCircle2,
  Clock,
  Search,
  ArrowUpDown,
  Filter,
  Loader2,
  Phone
} from "lucide-react";
import toast from "react-hot-toast";

interface Profile {
  full_name: string;
  phone: string;
}

interface Order {
  id: string;
  created_at: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: string;
  total: number;
  shipping_address: any;
  profile: Profile;
  order_items: any[];
}

export default function AdminDeliveryPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "processing" | "shipped" | "delivered">("all");
  const [sortBy, setSortBy] = useState<"date" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error);
      
      // Filter out pending and cancelled orders for the delivery view
      // We mainly care about fulfillment lifecycle: confirmed -> processing -> shipped -> delivered
      const deliveryOrders = (result.data || []).filter((o: Order) => 
        ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status)
      );
      
      setOrders(deliveryOrders);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch deliveries");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Order["status"]) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
      
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      toast.success(`Order marked as ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update delivery status");
    } finally {
      setUpdating(null);
    }
  };

  // Derived Stats
  const processingCount = orders.filter(o => o.status === "confirmed" || o.status === "processing").length;
  const inTransitCount = orders.filter(o => o.status === "shipped").length;
  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  
  const filteredOrders = orders
    .filter((o) => {
      const addressString = o.shipping_address ? JSON.stringify(o.shipping_address).toLowerCase() : "";
      const nameString = o.profile?.full_name?.toLowerCase() || "";
      const idString = o.id.toLowerCase();
      
      const searchMatch = searchQuery === "" || 
        nameString.includes(searchQuery.toLowerCase()) || 
        addressString.includes(searchQuery.toLowerCase()) ||
        idString.includes(searchQuery.toLowerCase());

      const statusMatch = statusFilter === "all" ? true :
        statusFilter === "processing" ? (o.status === "confirmed" || o.status === "processing") :
        o.status === statusFilter;

      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "status") {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (type: "date" | "status") => {
    if (sortBy === type) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(type); setSortOrder("desc"); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'processing':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/50 flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-sm bg-indigo-500 animate-pulse" /> Processing</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200/50 flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-sm bg-amber-500" /> In Transit</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/50 flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-sm bg-emerald-500" /> Delivered</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-slate-50 text-slate-700 border border-slate-200/50 flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-sm bg-slate-500" /> {status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-[#475569]">Loading active deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] text-[#0F172A] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            Dispatch & Delivery Tracker
          </h2>
          <p className="text-xs text-[#475569] mt-1">
            Manage order fulfillment, print labels, and track shipments in real-time.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Awaiting Dispatch</span>
            <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center">
              <PackageOpen className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{processingCount}</p>
        </div>

        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">In Transit</span>
            <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center">
              <Truck className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{inTransitCount}</p>
        </div>

        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Delivered</span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{deliveredCount}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, address, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#EEF2F7] bg-slate-50/50 text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3.5 py-2 rounded-md transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Delivery States</option>
              <option value="processing">Awaiting Dispatch</option>
              <option value="shipped">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <span className="w-px h-6 bg-slate-200 hidden sm:block mx-1" />

          <button onClick={() => toggleSort("date")} className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-md border transition-all cursor-pointer ${sortBy === "date" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Date <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>
          <button onClick={() => toggleSort("status")} className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-md border transition-all cursor-pointer ${sortBy === "status" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Status <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Deliveries Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm p-16 text-center text-[#94A3B8] text-sm">
          <Truck className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
          <p className="font-bold">No active deliveries found</p>
          <p className="text-xs text-[#94A3B8] mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const isProcessing = order.status === "confirmed" || order.status === "processing";
            const isShipped = order.status === "shipped";
            const isDelivered = order.status === "delivered";

            const address = order.shipping_address || {};

            return (
              <div key={order.id} className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden flex flex-col hover:border-indigo-200 hover:shadow-md transition-all">
                {/* Card Header */}
                <div className="p-4 border-b border-[#EEF2F7] bg-[#F8FAFC] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-white border border-[#EEF2F7] flex items-center justify-center shrink-0 shadow-sm font-black text-[#0F172A] text-xs">
                      #{order.id.slice(0,4)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{order.profile?.full_name || "Unknown Customer"}</p>
                      <div className="flex items-center gap-1 text-[10px] text-[#64748B] mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-grow flex flex-col sm:flex-row gap-4">
                  {/* Shipping Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Shipping Address
                      </h4>
                      <p className="text-xs font-semibold text-[#0F172A] leading-relaxed">
                        {address.address}<br />
                        {address.city}, {address.postalCode}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] mb-1.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Contact
                      </h4>
                      <p className="text-xs font-semibold text-[#0F172A]">
                        {address.phone || order.profile?.phone || "No phone provided"}
                      </p>
                    </div>
                  </div>

                  {/* Order Payload */}
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-md p-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] mb-2">Package Contents ({order.order_items?.length || 0})</h4>
                    <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                      {(order.order_items || []).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#0F172A] truncate pr-2">
                            {item.quantity}x {item.product?.name || "Unknown"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 border-t border-[#EEF2F7] bg-white flex items-center gap-2">
                  {isProcessing && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, "shipped")}
                      disabled={updating === order.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {updating === order.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                      Dispatch / Mark Shipped
                    </button>
                  )}
                  
                  {isShipped && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, "delivered")}
                      disabled={updating === order.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {updating === order.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Confirm Delivery
                    </button>
                  )}

                  {isDelivered && (
                    <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 text-slate-400 text-xs font-black rounded-md border border-slate-100">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Delivery Complete
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F1F5F9; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94A3B8; 
        }
      `}} />
    </div>
  );
}
