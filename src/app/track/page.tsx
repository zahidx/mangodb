"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import RealtimeOrderStatus from "@/components/RealtimeOrderStatus";
import InvoiceTemplate from "@/components/InvoiceTemplate";
import { downloadInvoicePdf } from "@/lib/downloadInvoicePdf";
import { getOrderById } from "@/lib/supabase/queries";
import {
  Bike,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Home,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderIdParam = searchParams.get("id");

  const [searchMode, setSearchMode] = useState<"id" | "email">("id");
  const [searchId, setSearchId] = useState(orderIdParam ? orderIdParam.replace(/^#?MNG-/, "") : "");
  const [searchEmail, setSearchEmail] = useState("");
  const [order, setOrder] = useState<any | null>(null);
  const [orderList, setOrderList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  // Mock static demo orders with concise courier details
  const MOCK_TRACK_ORDERS: Record<string, any> = {
    "MNG-925599": {
      id: "MNG-925599",
      status: "in_transit",
      subtotal: 1200,
      delivery_charge: 120,
      discount: 100,
      total: 1220,
      payment_status: "paid",
      payment_method: "bkash",
      carrier: "MangoBite Express Agro-Fleet",
      vehicle: "DHAKA-METRO-TA-4491",
      driver_name: "Md. Rafiqul Islam",
      driver_phone: "+880 1712-345678",
      origin_hub: "Rajshahi Depot",
      destination_hub: "Dhaka Central Hub",
      created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      shipping_address: {
        full_name: "Mahmud Hasan",
        address_line_1: "House 12, Road 4, Sector 7, Uttara, Dhaka",
        phone: "+880 1711-223344",
        city: "Dhaka",
      },
      order_items: [
        {
          product: {
            name: "Premium Rajshahi Himsagar",
            images: ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80"],
          },
          selected_weight: "10kg crate",
          quantity: 1,
          unit_price: 1200,
          total_price: 1200,
        },
      ],
    },
    "MNG-152305": {
      id: "MNG-152305",
      status: "pending",
      subtotal: 549,
      delivery_charge: 120,
      discount: 0,
      total: 669,
      payment_status: "pending",
      payment_method: "bkash",
      carrier: "MangoBite Express Fleet",
      vehicle: "RAJ-METRO-KA-1022",
      driver_name: "Tariq Hossain",
      driver_phone: "+880 1799-887766",
      origin_hub: "Rajshahi Depot",
      destination_hub: "Sirajganj Local Hub",
      created_at: "2026-06-28T23:26:00.000Z",
      updated_at: "2026-06-28T23:26:00.000Z",
      shipping_address: {
        full_name: "Zahid Islam",
        address_line_1: "Mathaichapor, Kazipur, Sirajganj",
        phone: "+88 01742-805845",
        city: "Sirajganj",
      },
      order_items: [
        {
          product: {
            name: "Rajshahi Himsagar",
            images: ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80"],
          },
          selected_weight: "10kg crate",
          quantity: 1,
          unit_price: 549,
          total_price: 549,
        },
      ],
    },
    "MNG-8842": {
      id: "MNG-8842",
      status: "processing",
      subtotal: 999,
      delivery_charge: 120,
      discount: 0,
      total: 1119,
      payment_status: "paid",
      payment_method: "cod",
      carrier: "Steadfast Express",
      vehicle: "DHA-CHA-8910",
      driver_name: "Al-Amin Sheikh",
      driver_phone: "+880 1822-114477",
      origin_hub: "Rajshahi Depot",
      destination_hub: "Dhanmondi Hub",
      created_at: "2026-07-01T10:30:00.000Z",
      updated_at: "2026-07-01T10:45:00.000Z",
      shipping_address: {
        full_name: "Tariqul Anam",
        address_line_1: "House 24, Road 8, Dhanmondi, Dhaka",
        phone: "+88 01823-456789",
        city: "Dhaka",
      },
      order_items: [
        {
          product: {
            name: "Lengra Special Harvest",
            images: ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80"],
          },
          selected_weight: "10kg crate",
          quantity: 1,
          unit_price: 999,
          total_price: 999,
        },
      ],
    },
    "MNG-7731": {
      id: "MNG-7731",
      status: "delivered",
      subtotal: 550,
      delivery_charge: 120,
      discount: 0,
      total: 670,
      payment_status: "paid",
      payment_method: "bkash",
      carrier: "Pathao Express",
      vehicle: "DHA-HA-2201",
      driver_name: "Kamrul Hasan",
      driver_phone: "+880 1933-221100",
      origin_hub: "Rajshahi Depot",
      destination_hub: "Uttara Hub",
      created_at: "2026-06-30T16:15:00.000Z",
      updated_at: "2026-07-01T14:30:00.000Z",
      shipping_address: {
        full_name: "Nusrat Faria",
        address_line_1: "Apartment 4B, Sector 4, Uttara, Dhaka",
        phone: "+88 01987-654321",
        city: "Dhaka",
      },
      order_items: [
        {
          product: {
            name: "Amrapali Orchard Reserve",
            images: ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80"],
          },
          selected_weight: "5kg crate",
          quantity: 1,
          unit_price: 550,
          total_price: 550,
        },
      ],
    },
  };

  const performSearch = async (targetId: string) => {
    if (!targetId.trim()) return;

    let formattedId = targetId.trim().toUpperCase();
    if (/^\d+$/.test(formattedId)) {
      formattedId = `MNG-${formattedId}`;
    }
    if (formattedId.startsWith("#")) {
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
      const byEmail = JSON.parse(localStorage.getItem("mangobite-guest-orders-by-email") || "{}");
      const guestOrderIds: string[] = byEmail[cleanEmail] || [];

      const guestStored = JSON.parse(localStorage.getItem("mangobite-guest-orders") || "[]");
      const ordersByEmail = guestStored.filter(
        (o: any) => o._guestEmail?.toLowerCase() === cleanEmail || guestOrderIds.includes(o.id)
      );

      const storedOrders = JSON.parse(localStorage.getItem("mangobite-orders") || "[]");
      const matchedStored = storedOrders.filter(
        (o: any) => o.shipping_address?.email?.toLowerCase() === cleanEmail
      );

      const allFound = [...ordersByEmail, ...matchedStored];
      if (allFound.length > 0) {
        setOrderList(allFound);
        toast.success(`Found ${allFound.length} order(s)`);
      } else {
        setOrderList([]);
        toast.error("No orders found for this email");
      }
    } catch (err) {
      toast.error("Failed to search orders");
      setOrderList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderIdParam) {
      setSearchId(orderIdParam.replace(/^#?MNG-/, ""));
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

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success(`Copied ${id}`);
  };

  const handleDownloadInvoice = async (orderData: any) => {
    setIsDownloadingInvoice(true);
    toast.loading("Generating PDF...", { id: "track-inv" });
    try {
      const ok = await downloadInvoicePdf("track-invoice-pdf-element", orderData.id);
      if (ok) {
        toast.success("Invoice PDF downloaded!", { id: "track-inv" });
      } else {
        toast.error("Failed to generate PDF.", { id: "track-inv" });
      }
    } catch {
      toast.error("PDF download failed.", { id: "track-inv" });
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  // 4 Core Stages (Clean & Focused)
  const getCourierStages = (status: string, createdAt: string, updatedAt: string) => {
    let activeIndex = 0;
    if (status === "pending") activeIndex = 0;
    else if (status === "processing" || status === "confirmed") activeIndex = 1;
    else if (status === "shipped" || status === "in_transit") activeIndex = 2;
    else if (status === "out_for_delivery") activeIndex = 2;
    else if (status === "delivered") activeIndex = 3;
    else if (status === "cancelled") activeIndex = -1;

    const formatDate = (date: Date) =>
      date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    const cDate = new Date(createdAt);
    const uDate = new Date(updatedAt);

    return [
      {
        id: "ordered",
        title: "Order Placed",
        date: activeIndex >= 0 ? formatDate(cDate) : "Scheduled",
        isCompleted: activeIndex > 0,
        isActive: activeIndex === 0,
        icon: Package,
      },
      {
        id: "packed",
        title: "Packaging & QC",
        date: activeIndex >= 1 ? formatDate(activeIndex === 1 ? cDate : uDate) : "In Queue",
        isCompleted: activeIndex > 1,
        isActive: activeIndex === 1,
        icon: ShieldCheck,
      },
      {
        id: "transit",
        title: "In Transit",
        date: activeIndex >= 2 ? formatDate(activeIndex === 2 ? cDate : uDate) : "Pending",
        isCompleted: activeIndex > 2,
        isActive: activeIndex === 2,
        icon: Truck,
      },
      {
        id: "delivered",
        title: "Delivered",
        date: activeIndex === 3 ? formatDate(uDate) : "ETA: 2–3 Days",
        isCompleted: activeIndex === 3,
        isActive: activeIndex === 3,
        icon: Home,
      },
    ];
  };

  const getCleanLogs = (ord: any) => {
    const formatTime = (dateStr: string) => {
      const d = new Date(dateStr);
      return (
        d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
        " • " +
        d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    };

    const logs = [
      {
        title: "Order Registered",
        location: "Rajshahi Orchard Station",
        time: formatTime(ord.created_at),
        state: "completed",
      },
    ];

    if (ord.status !== "pending" && ord.status !== "cancelled") {
      logs.unshift({
        title: "Quality Packaged & Sealed",
        location: "Charghat Packing Hub",
        time: formatTime(ord.updated_at || ord.created_at),
        state: "completed",
      });
    }

    if (ord.status === "shipped" || ord.status === "in_transit" || ord.status === "delivered") {
      logs.unshift({
        title: "Dispatched in Transit",
        location: "Highway Corridor Checkpoint",
        time: formatTime(ord.updated_at || ord.created_at),
        state: ord.status === "in_transit" ? "active" : "completed",
      });
    }

    if (ord.status === "delivered") {
      logs.unshift({
        title: "Doorstep Delivered",
        location: ord.shipping_address?.city || "Destination",
        time: formatTime(ord.updated_at),
        state: "delivered",
      });
    }

    return logs;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-24 w-full grow space-y-6">
        
        {/* =========================================
            CLEAN SEARCH BAR
           ========================================= */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-hero-text">
                Track Shipment
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time delivery status & courier checkpoints
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted-bg p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setSearchMode("id")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  searchMode === "id"
                    ? "bg-card text-hero-text shadow-xs"
                    : "text-muted-foreground hover:text-hero-text"
                }`}
              >
                Order ID
              </button>
              <button
                type="button"
                onClick={() => setSearchMode("email")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  searchMode === "email"
                    ? "bg-card text-hero-text shadow-xs"
                    : "text-muted-foreground hover:text-hero-text"
                }`}
              >
                Email
              </button>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="pt-1">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={searchMode === "id" ? "text" : "email"}
                  required
                  placeholder={searchMode === "id" ? "Enter Order ID (e.g. 925599)" : "Enter your email address"}
                  value={searchMode === "id" ? searchId : searchEmail}
                  onChange={(e) => (searchMode === "id" ? setSearchId(e.target.value) : setSearchEmail(e.target.value))}
                  className="w-full pl-11 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-hero-text placeholder:text-muted-foreground placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {(searchId || searchEmail) && (
                  <button
                    type="button"
                    onClick={() => (searchMode === "id" ? setSearchId("") : setSearchEmail(""))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-hero-text transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 stroke-[2.5]" />}
                <span>Track</span>
              </button>
            </div>

            {searchMode === "id" && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-2.5">
                <span className="font-medium">Demo IDs:</span>
                {["MNG-925599", "MNG-152305", "MNG-8842", "MNG-7731"].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setSearchId(sample);
                      performSearch(sample);
                    }}
                    className="font-bold font-mono px-2 py-0.5 rounded-md bg-muted-bg border border-border text-hero-text hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    #{sample}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-xs">
            <Loader2 className="w-7 h-7 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-sm font-bold text-hero-text">Loading tracking details...</p>
          </div>
        )}

        {/* Email Order Results List */}
        {!loading && hasSearched && orderList.length > 0 && !order && (
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Orders Found ({orderList.length})
            </h2>

            <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
              {orderList.map((ord: any) => (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => performSearch(ord.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted-bg/50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-extrabold font-mono text-hero-text">#{ord.id}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ord.order_items?.[0]?.product?.name || "Mango Order"} • ৳{ord.total}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase text-emerald-600">
                    {ord.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =========================================
            CLEAN COURIER SHIPMENT TRACKER
           ========================================= */}
        {!loading && hasSearched && order && (() => {
          const stages = getCourierStages(order.status, order.created_at, order.updated_at);
          const completedCount = stages.filter((s) => s.isCompleted).length;
          const progressPercentage =
            order.status === "delivered"
              ? 100
              : Math.max(15, Math.min(90, (completedCount / (stages.length - 1)) * 100));

          const logs = getCleanLogs(order);

          const items = order.order_items || [];
          const subtotal =
            order.subtotal ||
            items.reduce((sum: number, i: any) => sum + (i.total_price || i.unit_price * i.quantity || 0), 0);
          const deliveryCharge = order.delivery_charge || 120;
          const discount = order.discount || 0;
          const total = order.total || subtotal + deliveryCharge - discount;

          return (
            <div className="space-y-6 animate-fade-in">
              
              {/* Top Summary Card */}
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <button
                        type="button"
                        onClick={() => handleCopyOrderId(order.id)}
                        className="text-xs font-mono font-bold text-hero-text hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
                      >
                        <span>#{order.id}</span>
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-hero-text">
                      Estimated Arrival: <span className="text-emerald-600 dark:text-emerald-400">2–3 Working Days</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <RealtimeOrderStatus orderId={order.id} onOrderUpdate={(updated) => setOrder(updated)} />
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(order)}
                      disabled={isDownloadingInvoice}
                      className="py-2 px-3.5 bg-card border border-border hover:bg-muted-bg text-hero-text text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloadingInvoice ? "PDF..." : "Invoice PDF"}</span>
                    </button>
                  </div>
                </div>

                {/* ===== CLEAN CONNECTED MILESTONE STEPPER ===== */}
                <div className="space-y-4 pt-1">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Fulfillment Milestones
                  </div>

                  {/* Desktop Connected Bar */}
                  <div className="hidden sm:block relative pt-4 pb-2 px-4">
                    {/* Track line */}
                    <div className="absolute top-[28px] left-[10%] right-[10%] h-1.5 bg-muted-bg border border-border rounded-full" />
                    <div
                      className="absolute top-[28px] left-[10%] h-1.5 bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${progressPercentage * 0.8}%` }}
                    />

                    {/* Nodes */}
                    <div className="flex justify-between relative z-10">
                      {stages.map((st) => {
                        const Icon = st.icon;
                        const isDone = st.isCompleted;
                        const isCurrent = st.isActive;

                        return (
                          <div key={st.id} className="flex flex-col items-center text-center w-1/4">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-all border ${
                                isDone
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                  : isCurrent
                                  ? "bg-card text-emerald-600 border-2 border-emerald-500 ring-4 ring-emerald-500/15"
                                  : "bg-muted-bg text-muted-foreground border-border opacity-70"
                              }`}
                            >
                              {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4 stroke-[2]" />}
                            </div>

                            <span
                              className={`text-xs font-extrabold ${
                                isDone || isCurrent ? "text-hero-text" : "text-muted-foreground opacity-70"
                              }`}
                            >
                              {st.title}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {st.date}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile Connected Bar */}
                  <div className="sm:hidden grid grid-cols-2 gap-2.5">
                    {stages.map((st) => {
                      const Icon = st.icon;
                      const isDone = st.isCompleted;
                      const isCurrent = st.isActive;

                      return (
                        <div
                          key={st.id}
                          className={`p-3 rounded-2xl border ${
                            isDone
                              ? "bg-emerald-500/10 border-emerald-500/30"
                              : isCurrent
                              ? "bg-card border-emerald-500 ring-2 ring-emerald-500/20"
                              : "bg-muted-bg/30 border-border opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                                isDone
                                  ? "bg-emerald-600 text-white"
                                  : isCurrent
                                  ? "bg-emerald-500 text-white"
                                  : "bg-muted-bg text-muted-foreground"
                              }`}
                            >
                              {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-xs font-extrabold text-hero-text">{st.title}</span>
                          </div>
                          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pl-8">{st.date}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Clean Courier Telemetry Row */}
                <div className="pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Carrier</span>
                    <p className="font-bold text-hero-text mt-0.5 truncate">{order.carrier || "MangoBite Fleet"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Vehicle</span>
                    <p className="font-bold font-mono text-hero-text mt-0.5">{order.vehicle || "DHAKA-TA-4491"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Rider</span>
                    <p className="font-bold text-hero-text mt-0.5">{order.driver_name || "Md. Rafiqul"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Contact</span>
                    <a
                      href={`tel:${order.driver_phone || "+880170000000"}`}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5 inline-block"
                    >
                      {order.driver_phone || "+880 1700-000000"}
                    </a>
                  </div>
                </div>

              </div>

              {/* 2-Column Clean Details */}
              <div className="grid md:grid-cols-12 gap-6 items-start">
                
                {/* Left: Purchased Items & Price Summary */}
                <div className="md:col-span-7 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Purchased Crates ({items.length})
                  </h3>

                  <div className="border border-border rounded-2xl bg-card divide-y divide-border overflow-hidden shadow-xs">
                    {items.map((item: any, idx: number) => {
                      const itemPrice = item.unit_price || item.total_price || 0;
                      return (
                        <div key={idx} className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-muted-bg border border-border overflow-hidden shrink-0 flex items-center justify-center">
                              {item.product?.images?.[0] ? (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-hero-text">
                                {item.product?.name || item.name || "Mango Harvest"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.selected_weight || "10kg crate"} × {item.quantity || 1}
                              </p>
                            </div>
                          </div>

                          <span className="text-sm font-extrabold text-hero-text">
                            ৳ {(item.total_price || itemPrice * (item.quantity || 1)).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Clean Price Breakdown */}
                  <div className="border border-border rounded-2xl bg-card p-4 space-y-2 text-xs font-medium shadow-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-bold text-hero-text">৳ {subtotal.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Discount</span>
                        <span>- ৳ {discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      <span className="font-bold text-hero-text">৳ {deliveryCharge}</span>
                    </div>
                    <div className="pt-2.5 border-t border-border flex justify-between items-center text-sm font-bold">
                      <span className="text-hero-text">Total Payable</span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        ৳ {total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Consignee & Clean Checkpoint Log */}
                <div className="md:col-span-5 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Destination & Scans
                  </h3>

                  {/* Consignee */}
                  <div className="border border-border rounded-2xl bg-card p-4 space-y-2 text-xs shadow-xs">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Consignee</span>
                      <p className="font-bold text-hero-text mt-0.5">{order.shipping_address?.full_name || "Valued Customer"}</p>
                      <p className="text-muted-foreground mt-0.5">{order.shipping_address?.phone}</p>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Address</span>
                      <p className="font-medium text-hero-text mt-0.5">{order.shipping_address?.address_line_1}</p>
                    </div>
                  </div>

                  {/* Clean Checkpoint Feed */}
                  <div className="border border-border rounded-2xl bg-card p-4 space-y-3 shadow-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                      Live Checkpoint Feed
                    </span>

                    <div className="space-y-3 pt-1">
                      {logs.map((log, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-hero-text">{log.title}</p>
                            <p className="text-[11px] text-muted-foreground">{log.location} • {log.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Support */}
                  <div className="flex gap-2">
                    <a
                      href="tel:+880170000000"
                      className="flex-1 py-2.5 px-3 bg-card border border-border hover:bg-muted-bg rounded-xl text-hero-text text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Call Support</span>
                    </a>
                    <a
                      href="https://wa.me/8801700000000"
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 px-3 bg-card border border-border hover:bg-muted-bg rounded-xl text-hero-text text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                </div>

              </div>

              {/* Hidden Offscreen Invoice Template for Instant PDF Download */}
              <div className="fixed left-[-9999px] top-0 pointer-events-none opacity-0 overflow-hidden" aria-hidden="true">
                <InvoiceTemplate
                  id="track-invoice-pdf-element"
                  data={{
                    orderId: order.id,
                    createdAt: order.created_at,
                    customerName: order.shipping_address?.full_name || "Valued Customer",
                    customerPhone: order.shipping_address?.phone || "N/A",
                    customerEmail: order.shipping_address?.email || order._guestEmail || "",
                    address: order.shipping_address?.address_line_1 || "Bangladesh",
                    paymentMethod: order.payment_method || "Cash on Delivery",
                    paymentStatus: order.payment_status || "pending",
                    items: items.map((item: any) => ({
                      name: item.product?.name || item.name || "Harvest Mangoes",
                      weight: item.selected_weight || "10kg crate",
                      quantity: item.quantity || 1,
                      unitPrice: item.unit_price || item.total_price || 0,
                      totalPrice: item.total_price || (item.unit_price || 0) * (item.quantity || 1),
                    })),
                    subtotal,
                    deliveryCharge,
                    discount,
                    total,
                    deliveryDistrict: order.shipping_address?.city || "Bangladesh",
                  }}
                />
              </div>

            </div>
          );
        })()}

        {/* Not Found State */}
        {!loading && hasSearched && !order && (
          <div className="bg-card border border-border rounded-3xl p-10 text-center max-w-md mx-auto shadow-xs space-y-3">
            <Search className="w-6 h-6 text-amber-500 mx-auto" />
            <h3 className="text-lg font-bold text-hero-text">Order Not Found</h3>
            <p className="text-xs text-muted-foreground">
              No shipment found for <strong className="font-mono text-hero-text">#{searchId}</strong>.
            </p>
            <div className="pt-1 flex flex-wrap justify-center gap-1.5">
              {["MNG-925599", "MNG-152305", "MNG-8842", "MNG-7731"].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setSearchId(sample);
                    performSearch(sample);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-muted-bg border border-border text-xs font-mono font-bold text-hero-text hover:border-emerald-500 cursor-pointer"
                >
                  #{sample}
                </button>
              ))}
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col justify-between">
          <Navbar />
          <div className="grow flex items-center justify-center flex-col gap-3">
            <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
          </div>
          <Footer />
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
