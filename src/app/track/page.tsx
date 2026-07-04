"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Search, 
  MapPin, 
  Phone, 
  Loader2, 
  ClipboardList,
  Truck,
  Home,
  User,
  CreditCard,
  Package,
  MessageCircle,
  Map,
  Clock,
  Calendar,
  Check,
  XCircle,
  Bike
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getOrderById } from "@/lib/supabase/queries";
import toast from "react-hot-toast";
import Link from "next/link";

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderIdParam = searchParams.get("id");

  const [searchId, setSearchId] = useState(orderIdParam ? orderIdParam.replace(/^#?MNG-/, '') : "");
  const [order, setOrder] = useState<any | null>(null);
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
      const stored = JSON.parse(localStorage.getItem("mangodb-orders") || "[]");
      const matched = stored.find((o: any) => o.id === formattedId);
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

  useEffect(() => {
    if (orderIdParam) {
      setSearchId(orderIdParam.replace(/^#?MNG-/, ''));
      performSearch(orderIdParam);
    }
  }, [orderIdParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchId);
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
    <div className="min-h-screen bg-[#f4f7f5] dark:bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <div className="grow w-full px-4 sm:px-8 xl:px-12 2xl:px-24 py-28 relative z-0 flex flex-col gap-8">
        
        {/* 1. Header Search Card */}
        <div className="bg-card rounded-md p-8 sm:p-12 shadow-sm border border-border flex flex-col items-center text-center space-y-6 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-2 shadow-sm border border-emerald-500/20 relative z-10">
            <Map className="w-12 h-12 text-emerald-600" />
          </div>

          <div className="space-y-2 relative z-10">
            <h1 className="text-3xl font-bold text-slate-700 tracking-tight">Track Your Order</h1>
            <p className="text-muted-foreground text-sm font-medium">Enter your order ID below to get real-time delivery updates</p>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl flex flex-col sm:flex-row items-center gap-3 relative z-10 pt-2">
            <div className="flex-1 w-full relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                type="text"
                required
                placeholder="152305"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 bg-background border border-border rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
              />
              {searchId && (
                <button 
                  type="button" 
                  onClick={() => setSearchId('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <XCircle className="w-4 h-4 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                </button>
              )}
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-md font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} 
              Track Order
            </button>
          </form>
        </div>

        {/* 2. Results */}
        {!loading && hasSearched && order && (() => {
          const steps = getTimelineSteps(order.status, order.created_at, order.updated_at);
          const activeIndex = steps.filter(s => s.isCompleted).length - 1;
          const history = getHistory(order);

          return (
            <div className="flex flex-col gap-8 animate-fade-in w-full">
              
              {/* Shipping Info Card */}
              <div className="bg-card rounded-md p-6 sm:p-8 shadow-sm border border-border flex flex-col sm:flex-row justify-between gap-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold">
                    <User className="w-3.5 h-3.5" /> Shipping Info
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-hero-text">{order.shipping_address?.full_name}</h2>
                    <p className="text-muted-foreground flex items-center gap-1.5 mt-1.5 text-sm font-medium">
                      <MapPin className="w-4 h-4" /> {order.shipping_address?.address_line_1}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                      <CreditCard className="w-3.5 h-3.5" /> {order.payment_status === 'paid' ? 'Paid' : 'Partial / COD'}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                      <Package className="w-3.5 h-3.5" /> {order.status}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-start sm:items-end justify-start space-y-3 pt-2 sm:pt-0">
                  <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase mb-1">Need Help?</p>
                  <a href="tel:+8809677654321" className="flex items-center gap-2.5 text-emerald-600 font-bold text-sm hover:opacity-80 transition-opacity">
                    <Phone className="w-6 h-6 bg-emerald-500/10 p-1.5 rounded-full" /> +88 09677654321
                  </a>
                  <a href="#" className="flex items-center gap-2.5 text-emerald-500 font-bold text-sm hover:opacity-80 transition-opacity">
                    <MessageCircle className="w-6 h-6 bg-emerald-50 p-1.5 rounded-full" /> +88 01742-805845
                  </a>
                </div>
              </div>

              {/* Delivery Progress Card */}
              <div className="bg-card rounded-md p-6 sm:p-8 shadow-sm border border-border space-y-8 overflow-hidden">
                <div className="flex items-center gap-2 font-bold text-slate-700 text-lg tracking-tight">
                  <Map className="w-5 h-5 text-emerald-700" /> Delivery Progress
                </div>
                
                {/* Horizontal Timeline (Desktop) */}
                <div className="hidden md:block relative pt-6 pb-4">
                  <div className="relative px-4">
                    {/* Progress Bar Background */}
                    <div className="absolute top-[28px] left-[10%] right-[10%] h-1.5 bg-[#e2e8f0] rounded-full"></div>
                    {/* Progress Bar Active */}
                    <div 
                      className="absolute top-[28px] left-[10%] h-1.5 bg-emerald-600 rounded-full transition-all duration-1000" 
                      style={{ width: `${activeIndex >= 0 ? (activeIndex / (steps.length - 1)) * 80 : 0}%` }}
                    ></div>
                    
                    <div className="flex justify-between relative z-10">
                      {steps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center w-1/5 relative">
                          <div className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${step.isActive ? 'bg-emerald-500/10' : ''}`}>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center relative z-10 transition-colors duration-500 ${step.isCompleted ? 'bg-white border-[1.5px] border-emerald-700' : 'bg-muted-bg border-[1.5px] border-transparent'}`}>
                                <step.icon className={`w-5 h-5 ${step.isCompleted ? 'text-emerald-700' : step.color}`} />
                                {step.isCompleted && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                  </div>
                                )}
                            </div>
                            <p className={`mt-3 text-[11px] sm:text-xs font-bold text-center whitespace-nowrap transition-colors ${step.isCompleted ? 'text-[#1a2e24]' : 'text-slate-500'}`}>
                              {step.title}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium text-center mt-0.5 whitespace-nowrap">
                              {step.date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vertical Timeline (Mobile) */}
                <div className="md:hidden relative py-4 px-2">
                  {/* Vertical line background */}
                  <div className="absolute top-10 bottom-10 left-[35px] w-1 bg-[#e2e8f0] rounded-full"></div>
                  
                  {/* Vertical line active */}
                  <div 
                    className="absolute top-10 left-[35px] w-1 bg-emerald-600 rounded-full transition-all duration-1000"
                    style={{ height: `${activeIndex >= 0 ? (activeIndex / (steps.length - 1)) * 100 : 0}%` }}
                  ></div>

                  <div className="flex flex-col gap-6 relative z-10">
                    {steps.map((step, idx) => (
                      <div key={idx} className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 ${step.isActive ? 'bg-emerald-500/10' : ''}`}>
                        {/* Icon circle */}
                        <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center relative z-10 transition-colors duration-500 ${step.isCompleted ? 'bg-white border-[1.5px] border-emerald-700' : 'bg-muted-bg border-[1.5px] border-transparent'}`}>
                            <step.icon className={`w-4 h-4 ${step.isCompleted ? 'text-emerald-700' : step.color}`} />
                            {step.isCompleted && (
                              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                <Check className="w-2 h-2 text-white stroke-[3]" />
                              </div>
                            )}
                        </div>
                        {/* Text details */}
                        <div className="flex-1">
                          <p className={`text-sm font-bold transition-colors ${step.isCompleted ? 'text-[#1a2e24]' : 'text-slate-500'}`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {step.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tracking History Card */}
              <div className="bg-card rounded-md p-6 sm:p-8 shadow-sm border border-border space-y-8">
                <div className="flex items-center gap-2 font-bold text-slate-700 text-lg tracking-tight">
                  <Clock className="w-5 h-5 text-emerald-700" /> Tracking History
                </div>
                
                <div className="space-y-0 pl-2">
                  {history.map((item, idx) => (
                    <div key={idx} className="relative pl-10 pb-8 last:pb-0">
                      {/* Vertical line */}
                      {idx !== history.length - 1 && (
                        <div className="absolute left-[13px] top-7 bottom-[-8px] w-[2px] bg-[#e2e8f0]"></div>
                      )}
                      {/* Circle node */}
                      <div className="absolute left-0 top-1.5 w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
                      </div>
                      
                      <div className="pt-0.5">
                        <p className="text-sm font-semibold text-hero-text leading-relaxed">
                          {item.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mt-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {item.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })()}

        {!loading && hasSearched && !order && (
          <div className="text-center py-20 bg-card rounded-md border border-border max-w-md mx-auto space-y-4 shadow-sm w-full mt-8">
            <h3 className="text-xl font-bold text-hero-text">Order Not Found</h3>
            <p className="text-sm text-muted-foreground px-6">
              We couldn't find a harvest batch with that tracking ID. Please check the number and try again.
            </p>
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
