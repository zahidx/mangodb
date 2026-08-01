"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import RealtimeOrderStatus from "@/components/RealtimeOrderStatus";
import { getOrderById } from "@/lib/supabase/queries";
import {
    Bike,
    Check,
    ChevronRight,
    ClipboardList,
    Clock,
    Home,
    Loader2,
    Mail,
    MapPin,
    Package,
    Phone,
    Search,
    Truck,
    User,
    XCircle
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderIdParam = searchParams.get("id");

  const [searchMode, setSearchMode] = useState<"id" | "email">("id");
  const [searchId, setSearchId] = useState(orderIdParam ? orderIdParam.replace(/^#?MNG-/, '') : "");
  const [searchEmail, setSearchEmail] = useState("");
  const [order, setOrder] = useState<any | null>(null);
  const [orderList, setOrderList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Mock static orders for demo mode
  const MOCK_TRACK_ORDERS: Record<string, any> = {
    "MNG-152305": {
      id: "MNG-152305",
      status: "pending",
      total: 669,
      payment_status: "pending",
      payment_method: "bkash",
      created_at: "2026-06-28T23:26:00.000Z",
      updated_at: "2026-06-28T23:26:00.000Z",
      shipping_address: {
        full_name: "zahid Islam",
        address_line_1: "Mathaichapor, Kazipur, Sirajganj",
        phone: "+88 01742-805845"
      },
      order_items: [{ product: { name: "Rajshahi Himsagar" }, quantity: 1, total_price: 549 }]
    },
    "MNG-8842": {
      id: "MNG-8842",
      status: "processing",
      total: 1119,
      payment_status: "paid",
      payment_method: "cod",
      created_at: "2026-07-01T10:30:00.000Z",
      updated_at: "2026-07-01T10:45:00.000Z",
      shipping_address: {
        full_name: "Tariqul Anam",
        address_line_1: "House 24, Road 8, Dhanmondi, Dhaka",
        phone: "+88 01823-456789"
      }
    },
    "MNG-7731": {
      id: "MNG-7731",
      status: "delivered",
      total: 670,
      payment_status: "paid",
      payment_method: "bkash",
      created_at: "2026-06-30T16:15:00.000Z",
      updated_at: "2026-07-01T14:30:00.000Z",
      shipping_address: {
        full_name: "Nusrat Faria",
        address_line_1: "Apartment 4B, Sector 4, Uttara, Dhaka",
        phone: "+88 01987-654321"
      }
    }
  };

  const performSearch = async (targetId: string) => {
    if (!targetId.trim()) return;
    
    // Auto-prefix with MNG- if user just typed numbers
    let formattedId = targetId.trim().toUpperCase();
    if (/^\d+$/.test(formattedId)) {
      formattedId = `MNG-${formattedId}`;
    }
    if (formattedId.startsWith('#')) {
      formattedId = formattedId.substring(1);
    }

    setLoading(true);
    setHasSearched(true);
    setOrder(null);
    setOrderList([]);
    router.replace(`/track?id=${formattedId}`);

    try {
      if (MOCK_TRACK_ORDERS[formattedId]) {
        setOrder(MOCK_TRACK_ORDERS[formattedId]);
        setLoading(false);
        return;
      }
      const res = await getOrderById(formattedId);
      if (res.data) {
        setOrder(res.data);
        setLoading(false);
        return;
      }
      const stored = JSON.parse(localStorage.getItem("mangobite-orders") || "[]");
      const guestStored = JSON.parse(localStorage.getItem("mangobite-guest-orders") || "[]");
      const matched = [...stored, ...guestStored].find((o: any) => o.id === formattedId);
      if (matched) {
        setOrder(matched);
      } else {
        setOrder(null);
        toast.error("Order ID not found");
      }
    } catch (err) {
      toast.error("Failed to query order records");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const performEmailSearch = async (email: string) => {
    if (!email.trim()) return;
    const cleanEmail = email.trim().toLowerCase();

    setLoading(true);
    setHasSearched(true);
    setOrder(null);
    setOrderList([]);

    try {
      // Search in guest orders by email
      const byEmail = JSON.parse(localStorage.getItem("mangobite-guest-orders-by-email") || "{}");
      const guestOrderIds: string[] = byEmail[cleanEmail] || [];

      const guestStored = JSON.parse(localStorage.getItem("mangobite-guest-orders") || "[]");
      const ordersByEmail = guestStored.filter((o: any) =>
        o._guestEmail?.toLowerCase() === cleanEmail || guestOrderIds.includes(o.id)
      );

      // Also search in regular orders where shipping email matches
      const storedOrders = JSON.parse(localStorage.getItem("mangobite-orders") || "[]");
      const matchedStored = storedOrders.filter((o: any) =>
        o.shipping_address?.email?.toLowerCase() === cleanEmail
      );

      const allFound = [...ordersByEmail, ...matchedStored];
      if (allFound.length > 0) {
        setOrderList(allFound);
        toast.success(`Found ${allFound.length} order(s) for ${cleanEmail}`);
      } else {
        setOrderList([]);
        toast.error("No orders found for this email");
      }
    } catch (err) {
      toast.error("Failed to search orders by email");
      setOrderList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderIdParam) {
      setSearchId(orderIdParam.replace(/^#?MNG-/, ''));
      performSearch(orderIdParam);
    }
  }, [orderIdParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === "id") {
      performSearch(searchId);
    } else {
      performEmailSearch(searchEmail);
    }
  };

  const getTimelineSteps = (status: string, createdAt: string, updatedAt: string) => {
    let activeIndex = 0;
    if (status === "pending") activeIndex = 0;
    else if (status === "confirmed" || status === "processing") activeIndex = 1;
    else if (status === "shipped" || status === "in_transit") activeIndex = 2;
    else if (status === "out_for_delivery") activeIndex = 3;
    else if (status === "delivered") activeIndex = 4;
    else if (status === "cancelled") activeIndex = -1;

    const formatDate = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const cDate = new Date(createdAt);
    const uDate = new Date(updatedAt);

    return [
      {
        title: "Order Placed",
        date: activeIndex >= 0 ? formatDate(cDate) : "Pending",
        isCompleted: activeIndex >= 0,
        isActive: activeIndex === 0,
        icon: ClipboardList,
        color: "text-[#3b574a]"
      },
      {
        title: "Order Processed",
        date: activeIndex >= 1 ? formatDate(activeIndex === 1 ? cDate : uDate) : "Pending",
        isCompleted: activeIndex >= 1,
        isActive: activeIndex === 1,
        icon: Package,
        color: "text-amber-500"
      },
      {
        title: "In Transit",
        date: activeIndex >= 2 ? formatDate(activeIndex === 2 ? cDate : uDate) : "Pending",
        isCompleted: activeIndex >= 2,
        isActive: activeIndex === 2,
        icon: Truck,
        color: "text-blue-500"
      },
      {
        title: "Out for Delivery",
        date: activeIndex >= 3 ? formatDate(activeIndex === 3 ? cDate : uDate) : "Pending",
        isCompleted: activeIndex >= 3,
        isActive: activeIndex === 3,
        icon: Bike,
        color: "text-purple-500"
      },
      {
        title: "Delivered",
        date: activeIndex === 4 ? formatDate(uDate) : "Pending",
        isCompleted: activeIndex === 4,
        isActive: activeIndex === 4,
        icon: Home,
        color: "text-emerald-500"
      }
    ];
  };

  const getHistory = (order: any) => {
    const formatDateTime = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " - " + d.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
    };
    
    let history = [
      {
        message: `New order placed by ${order.shipping_address?.full_name} — Order ID: #${order.id.replace('MNG-', '')}. Processing will begin shortly.`,
        date: formatDateTime(order.created_at)
      }
    ];

    if (order.status !== 'pending' && order.status !== 'cancelled') {
      history.unshift({
        message: `Order #${order.id.replace('MNG-', '')} has been processed and is being packed.`,
        date: formatDateTime(order.updated_at || order.created_at)
      });
    }
    
    if (order.status === 'delivered') {
      history.unshift({
        message: `Package successfully delivered to ${order.shipping_address?.full_name}.`,
        date: formatDateTime(order.updated_at)
      });
    }

    return history;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* ===== HERO SEARCH SECTION ===== */}
      <section className="relative bg-white border-b border-gray-100">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-50/50 via-white to-emerald-50/30 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-36 pb-16 sm:pt-40 sm:pb-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Track Your Order</h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-md mx-auto">Enter your Order ID to see real-time delivery status and tracking timeline.</p>

          {/* Search Mode Toggle */}
          <div className="flex items-center justify-center gap-2 mt-6 mb-4">
            <button
              type="button"
              onClick={() => setSearchMode("id")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                searchMode === "id"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <Search className="w-3.5 h-3.5 inline mr-1.5" />
              By Order ID
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("email")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                searchMode === "email"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <Mail className="w-3.5 h-3.5 inline mr-1.5" />
              By Email (Guest)
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                {searchMode === "id" ? (
                  <>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Enter Order ID (e.g. 152305)"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    />
                    {searchId && (
                      <button type="button" onClick={() => setSearchId('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    />
                    {searchEmail && (
                      <button type="button" onClick={() => setSearchEmail('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {searchMode === "id" ? "Track Order" : "Find Orders"}
              </button>
            </div>
            {searchMode === "id" && (
              <p className="text-[11px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Try: <button type="button" onClick={() => { setSearchId("152305"); performSearch("MNG-152305"); }} className="text-emerald-600 hover:text-emerald-700 font-medium underline-offset-2 hover:underline">152305</button>,{" "}
                <button type="button" onClick={() => { setSearchId("8842"); performSearch("MNG-8842"); }} className="text-emerald-600 hover:text-emerald-700 font-medium underline-offset-2 hover:underline">8842</button>,{" "}
                <button type="button" onClick={() => { setSearchId("7731"); performSearch("MNG-7731"); }} className="text-emerald-600 hover:text-emerald-700 font-medium underline-offset-2 hover:underline">7731</button>
              </p>
            )}
            {searchMode === "email" && (
              <p className="text-[11px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                Find all orders placed with this email address (works for guest checkouts).
              </p>
            )}
          </form>
        </div>
      </section>

      {/* ===== RESULTS ===== */}
      <div className="grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">

        {/* Email Search Results — Order List */}
        {!loading && hasSearched && orderList.length > 0 && !order && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-500" />
                Your Orders ({orderList.length})
              </h2>
              <p className="text-xs text-gray-400">Click an order to track</p>
            </div>
            <div className="space-y-3">
              {orderList.map((ord: any) => (
                <button
                  key={ord.id}
                  onClick={() => performSearch(ord.id)}
                  className="w-full bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-emerald-300 hover:shadow-sm transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 font-mono">#{ord.id}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {ord.order_items?.[0]?.product?.name || ord.order_items?.[0]?.product_name || "Mango Order"} · ৳{ord.total}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      ord.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                      ord.status === "cancelled" ? "bg-red-100 text-red-600" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {ord.status?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(ord.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No orders found for email */}
        {!loading && hasSearched && orderList.length === 0 && !order && searchMode === "email" && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No Orders Found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
              We couldn't find any orders for this email. Try searching by Order ID instead.
            </p>
            <button
              onClick={() => setSearchMode("id")}
              className="mt-4 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Search by Order ID
            </button>
          </div>
        )}

        {/* Single Order Detail */}
        {!loading && hasSearched && order && (() => {
          const steps = getTimelineSteps(order.status, order.created_at, order.updated_at);
          const activeIndex = steps.filter(s => s.isCompleted).length - 1;
          const history = getHistory(order);

          const statusColors: Record<string, string> = {
            pending: "bg-amber-100 text-amber-800 border-amber-200",
            processing: "bg-blue-100 text-blue-800 border-blue-200",
            confirmed: "bg-blue-100 text-blue-800 border-blue-200",
            shipped: "bg-purple-100 text-purple-800 border-purple-200",
            in_transit: "bg-purple-100 text-purple-800 border-purple-200",
            out_for_delivery: "bg-indigo-100 text-indigo-800 border-indigo-200",
            delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
            cancelled: "bg-red-100 text-red-800 border-red-200",
          };
          const statusLabel = order.status?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

          return (
            <div className="space-y-6 animate-fade-in">

              {/* ===== SHIPPING INFO CARD ===== */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shipping Information</span>
                      <RealtimeOrderStatus orderId={order.id} onOrderUpdate={(updated) => setOrder(updated)} />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{order.shipping_address?.full_name}</h2>
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-600">{order.shipping_address?.address_line_1}</p>
                      </div>
                      {order.shipping_address?.phone && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-500">{order.shipping_address.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border ${statusColors[order.status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                        <Package className="w-3.5 h-3.5" />
                        {statusLabel}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border ${
                        order.payment_status === 'paid' || order.payment_status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        {order.payment_status === 'paid' || order.payment_status === 'completed' ? 'Paid' : 'Pending'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 bg-gray-50 text-gray-700">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Support */}
                  <div className="sm:text-right space-y-2.5 pt-2 sm:pt-0 sm:border-l sm:border-gray-100 sm:pl-6">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Need Assistance?</p>
                    <a href="tel:+8809677654321" className="flex items-center sm:justify-end gap-2.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                      <Phone className="w-4 h-4" />
                      +88 09677654321
                    </a>
                    <a href="#" className="flex items-center sm:justify-end gap-2.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      Live Chat
                    </a>
                  </div>
                </div>
              </div>

              {/* ===== DELIVERY PROGRESS ===== */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-8">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Delivery Progress</h3>
                </div>

                {/* Desktop Timeline */}
                <div className="hidden md:block">
                  <div className="relative px-2 pb-2">
                    {/* Background bar */}
                    <div className="absolute top-[34px] left-[4%] right-[4%] h-[3px] bg-gray-100 rounded-full" />
                    {/* Active bar */}
                    <div
                      className="absolute top-[34px] left-[4%] h-[3px] bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${activeIndex >= 0 ? (activeIndex / (steps.length - 1)) * 92 : 0}%` }}
                    />
                    <div className="flex justify-between relative z-10">
                      {steps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center w-1/5">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${
                            step.isCompleted
                              ? 'bg-emerald-500 shadow-md shadow-emerald-200'
                              : step.isActive
                                ? 'bg-emerald-100 border-2 border-emerald-500'
                                : 'bg-gray-50 border-2 border-gray-200'
                          }`}>
                            <step.icon className={`w-5 h-5 ${
                              step.isCompleted ? 'text-white' : step.isActive ? 'text-emerald-600' : 'text-gray-300'
                            }`} />
                            {step.isCompleted && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full border-2 border-emerald-500 flex items-center justify-center shadow-sm">
                                <Check className="w-2.5 h-2.5 text-emerald-500 stroke-3" />
                              </div>
                            )}
                          </div>
                          <p className={`mt-3 text-xs font-semibold text-center ${
                            step.isCompleted || step.isActive ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {step.title}
                          </p>
                          <p className="text-[10px] text-gray-400 text-center mt-0.5 font-medium">
                            {step.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Timeline */}
                <div className="md:hidden relative">
                  <div className="absolute left-[23px] top-3 bottom-3 w-[2px] bg-gray-100 rounded-full" />
                  <div
                    className="absolute left-[23px] top-3 w-[2px] bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ height: `${activeIndex >= 0 ? (activeIndex / (steps.length - 1)) * 100 : 0}%` }}
                  />
                  <div className="space-y-6 relative z-10">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                          step.isCompleted
                            ? 'bg-emerald-500 shadow-md shadow-emerald-200'
                            : step.isActive
                              ? 'bg-emerald-100 border-2 border-emerald-500'
                              : 'bg-gray-50 border-2 border-gray-200'
                        }`}>
                          <step.icon className={`w-4 h-4 ${
                            step.isCompleted ? 'text-white' : step.isActive ? 'text-emerald-600' : 'text-gray-300'
                          }`} />
                          {step.isCompleted && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-emerald-500 flex items-center justify-center shadow-sm">
                              <Check className="w-2 h-2 text-emerald-500 stroke-3" />
                            </div>
                          )}
                        </div>
                        <div className="pt-1.5">
                          <p className={`text-sm font-semibold ${
                            step.isCompleted || step.isActive ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 font-medium">{step.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ===== ORDER SUMMARY ===== */}
              {order.order_items && order.order_items.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Order Items</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {order.order_items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg">🥭</div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.product?.name || `Item #${idx + 1}`}</p>
                            <p className="text-xs text-gray-400">Qty: {item.quantity || 1}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">৳ {(item.total_price || item.price || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Order Total</span>
                    <span className="text-lg font-bold text-emerald-600">৳ {order.total?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              )}

              {/* ===== TRACKING HISTORY ===== */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Tracking History</h3>
                </div>

                <div className="space-y-0">
                  {history.map((item, idx) => (
                    <div key={idx} className="relative pl-9 pb-7 last:pb-0">
                      {/* Connector line */}
                      {idx !== history.length - 1 && (
                        <div className="absolute left-[13.5px] top-6 bottom-0 w-[2px] bg-emerald-100" />
                      )}
                      {/* Dot */}
                      <div className={`absolute left-0 top-1.5 w-7 h-7 rounded-full flex items-center justify-center ${
                        idx === 0 ? 'bg-emerald-500' : 'bg-emerald-50 border border-emerald-200'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-white' : 'bg-emerald-400'}`} />
                      </div>

                      <div>
                        <p className={`text-sm leading-relaxed ${idx === 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {item.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {item.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })()}

        {/* ===== NOT FOUND ===== */}
        {!loading && hasSearched && !order && (
          <div className="text-center py-16 sm:py-20 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-lg mx-auto mt-8">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Order Not Found</h3>
            <p className="text-sm text-gray-500 mt-1.5 max-w-xs mx-auto">
              We couldn't find an order with that ID. Please double-check the number and try again.
            </p>
            <button
              type="button"
              onClick={() => { setSearchId(''); setHasSearched(false); setOrder(null); }}
              className="mt-6 text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline-offset-2 hover:underline transition-colors"
            >
              Try another ID
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <Navbar />
        <div className="grow flex items-center justify-center flex-col gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
        <Footer />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
