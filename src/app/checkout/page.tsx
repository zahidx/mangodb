"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  HelpCircle,
  Home,
  Info,
  Loader2,
  Lock,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  User,
  Wallet,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import InvoiceTemplate from "@/components/InvoiceTemplate";
import { downloadInvoicePdf } from "@/lib/downloadInvoicePdf";

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient() as any, []);
  const { profile } = useAuth();
  const { 
    cartItems, 
    loading,
    subtotal, 
    deliveryCharge, 
    discount, 
    total, 
    deliveryDistrict, 
    setDeliveryDistrict,
    clearCart,
    applyCoupon,
    removeCoupon,
    appliedCoupon
  } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuestBanner, setShowGuestBanner] = useState(true);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  // Form State
  const [checkoutForm, setCheckoutForm] = useState({
    orderFor: "Self",
    name: "",
    email: "",
    phone: "",
    division: "",
    district: "",
    upazila: "",
    address: "",
    orderNotes: "",
    paymentMethod: "cod" // "cod" | "bkash" | "nagad" | "sslcommerz"
  });

  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "pickup">("home");
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");

  // Geographic Data
  const [geoData, setGeoData] = useState<{ divisions: any[], districts: any[], upazilas: any[] }>({
    divisions: [],
    districts: [],
    upazilas: []
  });
  
  useEffect(() => {
    async function loadGeo() {
      try {
        const [divRes, distRes, upaRes] = await Promise.all([
          fetch('/data/divisions.json').then(r => r.json()),
          fetch('/data/districts.json').then(r => r.json()),
          fetch('/data/upazilas.json').then(r => r.json())
        ]);
        
        const divs = divRes.find((x: any) => x.type === "table")?.data || [];
        const dists = distRes.find((x: any) => x.type === "table")?.data || [];
        const upas = upaRes.find((x: any) => x.type === "table")?.data || [];
        
        setGeoData({ divisions: divs, districts: dists, upazilas: upas });
      } catch (err) {
        console.error("Failed to load geo data", err);
      }
    }
    loadGeo();
  }, []);

  // Post Order Success State
  const [orderCreatedId, setOrderCreatedId] = useState<string | null>(null);
  const [finalTotal, setFinalTotal] = useState<number>(0);
  const [finalAddress, setFinalAddress] = useState<string>("");
  const [finalItems, setFinalItems] = useState<any[]>([]);

  // User Saved Data
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  // Gateway Simulation Fields
  const [paymentForm, setPaymentForm] = useState({
    bkashPhone: "",
    bkashOtp: "",
    bkashPin: "",
    nagadPhone: "",
    nagadOtp: "",
    nagadPin: "",
  });
  const [bkashStep, setBkashStep] = useState(1);
  const [nagadStep, setNagadStep] = useState(1);

  const handlePaymentInput = (field: string, value: string) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }));
  };

  // Load Saved Addresses & Methods
  useEffect(() => {
    async function loadSavedData() {
      if (!profile) return;
      try {
        let payments: any[] = [];
        if (!profile.id.startsWith("demo-")) {
          const { data } = await supabase
            .from("user_payment_methods")
            .select("*")
            .eq("user_id", profile.id)
            .order("is_default", { ascending: false });
          if (data) payments = data;
        } else {
          const stored = localStorage.getItem(`mangobite-payments-${profile.id}`);
          if (stored) payments = JSON.parse(stored);
        }
        setSavedPaymentMethods(payments);
        const defPayment = payments.find(p => p.is_default);
        if (defPayment) {
          setCheckoutForm(prev => ({ ...prev, paymentMethod: `saved-${defPayment.id}` }));
        }

        let addrs: any[] = [];
        if (!profile.id.startsWith("demo-")) {
          const res = await fetch("/api/user/addresses");
          const json = await res.json();
          if (json.data) addrs = json.data;
        } else {
          const stored = localStorage.getItem(`mangobite-addresses-${profile.id}`);
          if (stored) addrs = JSON.parse(stored);
        }
        setSavedAddresses(addrs);

        try {
          const couponRes = await fetch("/api/coupons");
          const couponJson = await couponRes.json();
          if (couponJson.data) setAvailableCoupons(couponJson.data);
        } catch (_) {}

        const defaultAddr = addrs.find((a: any) => a.is_default);
        if (defaultAddr) {
          setCheckoutForm(prev => ({
            ...prev,
            name: defaultAddr.full_name || prev.name,
            phone: defaultAddr.phone || prev.phone,
            email: defaultAddr.email || prev.email,
            address: `${defaultAddr.street_address}${defaultAddr.apartment ? `, ${defaultAddr.apartment}` : ""}, ${defaultAddr.area}, ${defaultAddr.city}, ${defaultAddr.state}, ${defaultAddr.country}`,
          }));
        }
      } catch (err) {}
    }
    loadSavedData();
  }, [profile?.id]);

  // Autofill user contact info
  useEffect(() => {
    if (profile) {
      setCheckoutForm(prev => ({
        ...prev,
        name: profile.full_name || prev.name,
        email: profile.email || prev.email,
        phone: profile.phone || prev.phone
      }));
    }
  }, [profile?.id, profile?.full_name, profile?.email, profile?.phone]);

  useEffect(() => {
    if (orderCreatedId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [orderCreatedId]);

  const payableAmount = paymentType === "full" ? total : Math.round(total / 2);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "district") {
      const districtName = geoData.districts.find((d: any) => d.id === value)?.name || "";
      if (districtName) setDeliveryDistrict(districtName);
    }

    setCheckoutForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === "division") {
        next.district = "";
        next.upazila = "";
      }
      if (name === "district") {
        next.upazila = "";
      }
      return next;
    });
  };

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) return;
    const success = await applyCoupon(promoCode);
    if (!success) {
      setPromoCode("");
    }
  };

  const handleDownloadInvoice = async () => {
    if (!orderCreatedId) return;
    setIsDownloadingInvoice(true);
    toast.loading("Generating your invoice PDF...", { id: "inv-load" });
    try {
      const ok = await downloadInvoicePdf("checkout-invoice-pdf", orderCreatedId);
      if (ok) {
        toast.success("Invoice PDF downloaded successfully!", { id: "inv-load" });
      } else {
        toast.error("Failed to generate PDF. Please try again.", { id: "inv-load" });
      }
    } catch (err) {
      console.error(err);
      toast.error("PDF generation failed.", { id: "inv-load" });
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handlePlaceOrder = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!checkoutForm.name.trim() || !checkoutForm.phone.trim() || !checkoutForm.address.trim() || !checkoutForm.division || !checkoutForm.district || !checkoutForm.upazila) {
      toast.error("Please fill in all shipping fields including location details");
      return;
    }

    setIsSubmitting(true);
    const orderId = `MNG-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderData = {
      id: orderId,
      status: "pending",
      subtotal,
      tax: 0,
      total,
      shipping_address: {
        full_name: checkoutForm.name,
        address_line_1: checkoutForm.address,
        city: (geoData.districts.find((d: any) => d.id === checkoutForm.district) as any)?.name || deliveryDistrict,
        state: (geoData.divisions.find((d: any) => d.id === checkoutForm.division) as any)?.name || "BD",
        postal_code: "1000",
        country: "Bangladesh",
        phone: checkoutForm.phone,
        upazila: (geoData.upazilas.find((u: any) => u.id === checkoutForm.upazila) as any)?.name || "",
      },
      payment_status: checkoutForm.paymentMethod === "cod" ? "pending" : "paid",
      payment_id: checkoutForm.paymentMethod === "cod" ? null : `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order_items: cartItems.map((item) => {
        const itemPrice = item.product.sale_price || item.product.price;
        let multiplier = 1;
        if (item.selected_weight === "20kg") multiplier = 1.95;
        else if (item.selected_weight === "5kg") multiplier = 0.55;
        else if (item.selected_weight === "2kg") multiplier = 0.25;
        else if (item.selected_weight === "1kg") multiplier = 0.13;
        const finalPrice = Math.round(itemPrice * multiplier);

        return {
          id: `item-${Math.random()}`,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: finalPrice,
          total_price: finalPrice * item.quantity,
          product: item.product,
        };
      })
    };

    const isGuest = !profile || profile.id.startsWith("demo-");
    const guestId = isGuest ? `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null;
    const userId = !isGuest ? profile.id : null;

    if (userId) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .insert({
            user_id: userId,
            status: "pending",
            subtotal,
            tax: 0,
            total,
            shipping_address: orderData.shipping_address,
            payment_status: orderData.payment_status,
            payment_id: orderData.payment_id,
          })
          .select()
          .single();

        if (!error && data) {
          const itemsToInsert = cartItems.map((item) => {
            const itemPrice = item.product.sale_price || item.product.price;
            let multiplier = 1;
            if (item.selected_weight === "20kg") multiplier = 1.95;
            else if (item.selected_weight === "5kg") multiplier = 0.55;
            else if (item.selected_weight === "2kg") multiplier = 0.25;
            else if (item.selected_weight === "1kg") multiplier = 0.13;
            const finalPrice = Math.round(itemPrice * multiplier);

            return {
              order_id: data.id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: finalPrice,
              total_price: finalPrice * item.quantity,
            };
          });

          await supabase.from("order_items").insert(itemsToInsert);
          
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "Order Placed Successfully",
            message: `Your order #${data.id} has been registered and is scheduled for packaging.`,
            type: "order_placed"
          });
        }
      } catch (dbErr: any) {
        console.error("Database record error:", dbErr);
      }
    }

    const storageKey = isGuest ? `mangobite-guest-orders` : `mangobite-orders`;
    const existingOrders = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const orderWithMeta = {
      ...orderData,
      _guestEmail: isGuest ? checkoutForm.email : undefined,
      _guestId: guestId,
      _isGuest: isGuest,
    };
    localStorage.setItem(storageKey, JSON.stringify([orderWithMeta, ...existingOrders]));

    if (isGuest && checkoutForm.email) {
      const emailKey = `mangobite-guest-orders-by-email`;
      const byEmail = JSON.parse(localStorage.getItem(emailKey) || "{}");
      const email = checkoutForm.email.toLowerCase().trim();
      if (!byEmail[email]) byEmail[email] = [];
      byEmail[email].push(orderId);
      localStorage.setItem(emailKey, JSON.stringify(byEmail));
    }

    if (checkoutForm.email) {
      try {
        await fetch("/api/send-order-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderId,
            customerName: checkoutForm.name,
            email: checkoutForm.email,
            phone: checkoutForm.phone,
            total,
            productName: cartItems.map(i => `${i.product.name} (${i.selected_weight})`).join(", "),
            shippingAddress: checkoutForm.address,
            paymentMethod: checkoutForm.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment",
          }),
        });
      } catch (err) {
        console.error("Email notification error:", err);
      }
    }

    // SSLCommerz online redirect handler
    if (checkoutForm.paymentMethod === "sslcommerz") {
      toast.loading(`Connecting to secure banking gateway...`, { id: "payment-load" });
      try {
        const response = await fetch("/api/payment/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            total,
            customerName: checkoutForm.name,
            email: checkoutForm.email,
            phone: checkoutForm.phone,
            address: checkoutForm.address
          }),
        });
        
        const data = await response.json();
        
        if (data.url) {
          await clearCart();
          window.location.href = data.url;
          return;
        } else {
          toast.error("Banking gateway unreachable. Defaulting to Cash on Delivery.");
          setIsSubmitting(false);
          toast.dismiss("payment-load");
        }
      } catch (err) {
        toast.error("Banking initialization failed.");
        setIsSubmitting(false);
        toast.dismiss("payment-load");
        return;
      }
    }

    setFinalTotal(total);
    setFinalAddress(checkoutForm.address);
    setFinalItems(cartItems);
    setOrderCreatedId(orderId);
    await clearCart();
    setIsSubmitting(false);
    toast.success("Order placed successfully!");
  };

  // ==========================================
  // VIEW: EMPTY BASKET
  // ==========================================
  if (!loading && cartItems.length === 0 && !orderCreatedId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-32 text-center w-full grow flex items-center justify-center">
          <div className="w-full bg-card border border-border rounded-3xl p-10 sm:p-14 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-8 h-8 stroke-[2]" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-hero-text mb-2">
              Your Cart is Empty
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-8">
              No products are currently in your checkout session. Explore fresh seasonal Rajshahi harvest items in our catalog.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Browse Catalog</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-card hover:bg-muted-bg text-hero-text text-sm font-semibold rounded-xl transition-all border border-border cursor-pointer"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ==========================================
  // VIEW: ORDER CONFIRMATION
  // ==========================================
  if (orderCreatedId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-28 w-full grow">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
            
            {/* Celebration Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Order Confirmed
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      ID: {orderCreatedId}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-hero-text">
                    Thank You for Your Order!
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed max-w-xl">
                    We&apos;ve received your order and our Rajshahi orchard team is preparing your fresh harvest package.
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="self-start sm:self-center px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 shrink-0 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="whitespace-nowrap">Processing Order</span>
              </div>
            </div>

            {/* Live Progress Pipeline */}
            <div className="p-5 rounded-2xl border border-border bg-muted-bg/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Order Fulfillment Stage
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Order Placed</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Received & Verified</p>
                </div>

                <div className="p-3 rounded-xl border border-emerald-500/40 bg-card shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-hero-text mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Harvest & Pack</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Quality Sorting</p>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card/50 opacity-60">
                  <div className="text-xs font-semibold text-muted-foreground mb-0.5">
                    Dispatch & Transit
                  </div>
                  <p className="text-[11px] text-muted-foreground">Courier Handover</p>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card/50 opacity-60">
                  <div className="text-xs font-semibold text-muted-foreground mb-0.5">
                    Delivered
                  </div>
                  <p className="text-[11px] text-muted-foreground">Doorstep Arrival</p>
                </div>
              </div>
            </div>

            {/* 2-Column Summary Grid */}
            <div className="grid md:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Ordered Items */}
              <div className="md:col-span-7 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Purchased Items ({finalItems.length})
                </h3>

                <div className="border border-border rounded-2xl bg-card divide-y divide-border overflow-hidden shadow-xs">
                  {finalItems.map((item, idx) => {
                    const itemPrice = item.product.sale_price || item.product.price;
                    let multiplier = 1;
                    if (item.selected_weight === "20kg") multiplier = 1.95;
                    else if (item.selected_weight === "5kg") multiplier = 0.55;
                    else if (item.selected_weight === "2kg") multiplier = 0.25;
                    else if (item.selected_weight === "1kg") multiplier = 0.13;
                    const unitPrice = Math.round(itemPrice * multiplier);

                    return (
                      <div key={idx} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-muted-bg border border-border overflow-hidden shrink-0 relative flex items-center justify-center">
                            {item.product.images?.[0] ? (
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
                            <p className="text-sm font-semibold text-hero-text">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Weight: <span className="font-medium text-hero-text">{item.selected_weight}</span> • Qty: <span className="font-medium text-hero-text">{item.quantity}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-hero-text">
                            ৳ {(unitPrice * item.quantity).toLocaleString()}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            ৳ {unitPrice} / crate
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Farm Quality Guarantee Badge */}
                <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-hero-text">100% Naturally Ripened:</strong> All harvest crates are tested for carbide & formalin before packaging.
                  </p>
                </div>
              </div>

              {/* Right Column: Logistics & Financial Breakdown */}
              <div className="md:col-span-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Order Telemetry
                </h3>

                <div className="border border-border rounded-2xl bg-card p-5 space-y-4 shadow-xs">
                  {/* Delivery Location */}
                  <div>
                    <span className="text-xs text-muted-foreground font-medium block mb-1">
                      Shipping Address
                    </span>
                    <div className="flex items-start gap-2 text-xs font-medium text-hero-text">
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{finalAddress}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Payment Protocol</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted-bg border border-border text-hero-text">
                      {checkoutForm.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment Verified"}
                    </span>
                  </div>

                  {/* Expected Delivery */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Estimated Arrival</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">2–3 Working Days</span>
                  </div>

                  {/* Accounting Summary */}
                  <div className="pt-4 border-t border-border space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-semibold text-hero-text">৳ {subtotal.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Discount Coupon</span>
                        <span>- ৳ {discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Charge</span>
                      <span className="font-semibold text-hero-text">৳ {deliveryCharge}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted-bg/50 border border-border flex justify-between items-center mt-3">
                      <span className="text-xs font-bold text-hero-text">Total Payable</span>
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        ৳ {finalTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions Row */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={isDownloadingInvoice}
                className="py-3 px-5 bg-card border border-border hover:bg-muted-bg text-hero-text text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
              >
                {isDownloadingInvoice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Invoice PDF</span>
                  </>
                )}
              </button>
              <Link
                href={`/track?id=${orderCreatedId}`}
                className="py-3 px-5 bg-card border border-border hover:bg-muted-bg text-hero-text text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Truck className="w-4 h-4" />
                <span>Track Order</span>
              </Link>
              <Link
                href={profile && !profile.id.startsWith("demo-") ? "/dashboard" : "/products"}
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <span>{profile && !profile.id.startsWith("demo-") ? "View in Dashboard" : "Continue Shopping"}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Hidden Offscreen Invoice Template for Instant PDF Rendering */}
            <div
              className="fixed left-[-9999px] top-0 pointer-events-none opacity-0 overflow-hidden"
              aria-hidden="true"
            >
              <InvoiceTemplate
                id="checkout-invoice-pdf"
                data={{
                  orderId: orderCreatedId,
                  customerName: checkoutForm.name,
                  customerPhone: checkoutForm.phone,
                  customerEmail: checkoutForm.email,
                  address: finalAddress,
                  paymentMethod: checkoutForm.paymentMethod,
                  paymentStatus: checkoutForm.paymentMethod === "cod" ? "pending" : "paid",
                  items: finalItems.map((item) => {
                    const itemPrice = item.product.sale_price || item.product.price;
                    let multiplier = 1;
                    if (item.selected_weight === "20kg") multiplier = 1.95;
                    else if (item.selected_weight === "5kg") multiplier = 0.55;
                    else if (item.selected_weight === "2kg") multiplier = 0.25;
                    else if (item.selected_weight === "1kg") multiplier = 0.13;
                    const unitPrice = Math.round(itemPrice * multiplier);

                    return {
                      name: item.product.name,
                      weight: item.selected_weight,
                      quantity: item.quantity,
                      unitPrice,
                      totalPrice: unitPrice * item.quantity,
                    };
                  }),
                  subtotal,
                  deliveryCharge,
                  discount,
                  total: finalTotal,
                  deliveryDistrict,
                }}
              />
            </div>

          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN CHECKOUT FLOW
  // ==========================================
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Top Security & Region Bar */}
      <section className="pt-24 border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-hero-text font-semibold">Secure Checkout</span>
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
            <span>Delivery District: <strong className="text-hero-text">{deliveryDistrict}</strong></span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              256-Bit SSL Encrypted
            </span>
          </div>
        </div>
      </section>

      {/* Guest Mode Notification Bar (Dismissible Warning/Info) */}
      {(!profile || profile.id.startsWith("demo-")) && showGuestBanner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 w-full">
          <div className="border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
            <div className="flex items-start sm:items-center gap-3 pr-8 sm:pr-0">
              <div className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold">
                    Guest Mode
                  </span>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Checking out as Guest
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your order will be linked to your email & phone number.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/login"
                className="px-3.5 py-1.5 border border-amber-500/40 bg-card hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Sign In →
              </Link>
              <button
                type="button"
                onClick={() => setShowGuestBanner(false)}
                title="Dismiss notice"
                className="p-1.5 text-muted-foreground hover:text-hero-text hover:bg-muted-bg rounded-lg border border-transparent hover:border-border transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Grid */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">

        <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* =========================================
              LEFT COLUMN: FORM & PAYMENT MODULES
          ========================================= */}
          <div className="lg:col-span-7 space-y-8">

            {/* SECTION 01: RECIPIENT & DESTINATION */}
            <div className="border border-border bg-card rounded-3xl p-6 sm:p-8 shadow-xs">
              
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-hero-text">
                    Delivery Address
                  </h2>
                </div>
                <Truck className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Order For Selector */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Order Destination Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["Self", "Gift"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCheckoutForm(prev => ({ ...prev, orderFor: type }))}
                      className={`py-2.5 px-4 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
                        checkoutForm.orderFor === type
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "border-border bg-card text-muted-foreground hover:text-hero-text hover:border-border-strong"
                      }`}
                    >
                      {type === "Self" ? "For Myself" : "Send as Gift"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved Addresses (if logged in) */}
              {savedAddresses.length > 0 && (
                <div className="mb-5 p-4 rounded-2xl border border-border bg-muted-bg/30">
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">
                    Saved Addresses
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((addr: any) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setCheckoutForm(prev => ({
                            ...prev,
                            name: addr.full_name || prev.name,
                            phone: addr.phone || prev.phone,
                            email: addr.email || prev.email,
                            address: `${addr.street_address}${addr.apartment ? `, ${addr.apartment}` : ""}, ${addr.area}, ${addr.city}, ${addr.state}`,
                          }));
                          toast.success(`Loaded: ${addr.label || "Home"}`);
                        }}
                        className="px-3.5 py-1.5 rounded-lg border border-border bg-card hover:border-emerald-500 text-xs font-medium text-hero-text transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span className="font-semibold">{addr.label || "Address"}</span>
                        {addr.is_default && <span className="text-xs text-emerald-600 dark:text-emerald-400">★</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Fields */}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={checkoutForm.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Tanzim Ahmed"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-hero-text placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={checkoutForm.phone}
                    onChange={handleInputChange}
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-hero-text placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={checkoutForm.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com (For invoice & tracking updates)"
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-hero-text placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Cascading Geo Selectors */}
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Division <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="division"
                    required
                    value={checkoutForm.division}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="">Select Division</option>
                    {geoData.divisions.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="district"
                    required
                    value={checkoutForm.district}
                    onChange={handleInputChange}
                    disabled={!checkoutForm.division}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <option value="">Select District</option>
                    {geoData.districts.filter((d: any) => d.division_id === checkoutForm.division).map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Upazila / Area <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="upazila"
                    required
                    value={checkoutForm.upazila}
                    onChange={handleInputChange}
                    disabled={!checkoutForm.district}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-hero-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <option value="">Select Upazila</option>
                    {geoData.upazilas.filter((u: any) => u.district_id === checkoutForm.district).map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detailed Street Address */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Street Address / House / Road <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  value={checkoutForm.address}
                  onChange={handleInputChange}
                  placeholder="House #, Road #, Sector / Area details"
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-hero-text placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Delivery Fulfillment Mode */}
              <div className="p-4 rounded-2xl border border-border bg-muted-bg/30 mb-4">
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  Delivery Option
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    deliveryMethod === "home"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:border-border-strong"
                  }`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="home"
                      checked={deliveryMethod === "home"}
                      onChange={() => setDeliveryMethod("home")}
                      className="sr-only"
                    />
                    <Home className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-medium">Home Delivery</span>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    deliveryMethod === "pickup"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:border-border-strong"
                  }`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="pickup"
                      checked={deliveryMethod === "pickup"}
                      onChange={() => setDeliveryMethod("pickup")}
                      className="sr-only"
                    />
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-medium">Courier Hub Pickup</span>
                  </label>
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Order Notes (Optional)
                </label>
                <textarea
                  name="orderNotes"
                  rows={2}
                  value={checkoutForm.orderNotes}
                  onChange={handleInputChange}
                  placeholder="Special instructions for fragile crate transport..."
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-hero-text placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

            </div>

            {/* SECTION 02: PAYMENT METHOD */}
            <div className="border border-border bg-card rounded-3xl p-6 sm:p-8 shadow-xs">
              
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-hero-text">
                    Payment Method
                  </h2>
                </div>
                <CreditCard className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Settlement Structure: 100% vs 50% */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Payment Split
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType("full")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentType === "full"
                        ? "border-emerald-500 bg-emerald-500/10 shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:text-hero-text hover:border-border-strong"
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm font-bold mb-1">
                      <span className={paymentType === "full" ? "text-emerald-600 dark:text-emerald-400" : "text-hero-text"}>
                        100% Full Payment
                      </span>
                      <span className={paymentType === "full" ? "text-emerald-600 dark:text-emerald-400" : "text-hero-text"}>
                        ৳ {total.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pay complete amount now
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType("partial")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentType === "partial"
                        ? "border-emerald-500 bg-emerald-500/10 shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:text-hero-text hover:border-border-strong"
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm font-bold mb-1">
                      <span className={paymentType === "partial" ? "text-emerald-600 dark:text-emerald-400" : "text-hero-text"}>
                        50% Advance
                      </span>
                      <span className={paymentType === "partial" ? "text-emerald-600 dark:text-emerald-400" : "text-hero-text"}>
                        ৳ {Math.round(total / 2).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pay 50% now, remainder on delivery
                    </p>
                  </button>
                </div>
              </div>

              {/* Payment Methods Grid */}
              <div className="space-y-3 mb-6">
                <label className="block text-xs font-medium text-muted-foreground">
                  Select Gateway
                </label>

                {/* Cash on Delivery */}
                <label className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer select-none transition-all ${
                  checkoutForm.paymentMethod === "cod"
                    ? "border-emerald-500 bg-emerald-500/10 text-hero-text shadow-xs"
                    : "border-border bg-card hover:border-border-strong"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={checkoutForm.paymentMethod === "cod"}
                    onChange={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "cod" }))}
                    className="mt-1 accent-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-hero-text">
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        No Extra Fees
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Pay in cash when your order arrives safely at your doorstep.
                    </p>
                  </div>
                </label>

                {/* bKash Direct Channel */}
                <label className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer select-none transition-all ${
                  checkoutForm.paymentMethod === "bkash"
                    ? "border-[#e2136e] bg-[#e2136e]/10 text-hero-text shadow-xs"
                    : "border-border bg-card hover:border-border-strong"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bkash"
                    checked={checkoutForm.paymentMethod === "bkash"}
                    onChange={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "bkash" }))}
                    className="mt-1 accent-[#e2136e]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-hero-text">
                        bKash Payment
                      </span>
                      <span className="text-[11px] font-semibold bg-[#e2136e]/15 text-[#e2136e] px-2 py-0.5 rounded-md border border-[#e2136e]/30">
                        Instant
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Pay securely with bKash digital wallet with instant verification.
                    </p>
                  </div>
                </label>

                {/* bKash Terminal Submodule */}
                {checkoutForm.paymentMethod === "bkash" && (
                  <div className="p-4 rounded-2xl border border-[#e2136e]/40 bg-card text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-[#e2136e] font-bold">bKash Gateway Simulator</span>
                      <span className="text-muted-foreground font-mono font-medium">Payable: ৳{payableAmount}</span>
                    </div>
                    {bkashStep === 1 && (
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground block font-medium">Enter 11-Digit bKash Account Number</label>
                        <input
                          type="text"
                          placeholder="01XXXXXXXXX"
                          value={paymentForm.bkashPhone}
                          onChange={(e) => handlePaymentInput("bkashPhone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                          className="w-full rounded-xl border border-border bg-muted-bg/50 px-3.5 py-2.5 text-sm text-hero-text focus:outline-none focus:border-[#e2136e]"
                        />
                        <button
                          type="button"
                          disabled={paymentForm.bkashPhone.length !== 11}
                          onClick={() => setBkashStep(2)}
                          className="w-full py-2.5 rounded-xl bg-[#e2136e] text-white text-xs font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                        >
                          Send OTP Verification Code →
                        </button>
                      </div>
                    )}
                    {bkashStep === 2 && (
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground block font-medium">Enter 6-digit Code sent to {paymentForm.bkashPhone} (Code: 101010)</label>
                        <input
                          type="text"
                          placeholder="101010"
                          value={paymentForm.bkashOtp}
                          onChange={(e) => handlePaymentInput("bkashOtp", e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="w-full rounded-xl border border-border bg-muted-bg/50 px-3.5 py-2.5 text-sm text-hero-text text-center tracking-widest font-mono focus:outline-none focus:border-[#e2136e]"
                        />
                        <button
                          type="button"
                          disabled={paymentForm.bkashOtp !== "101010"}
                          onClick={() => setBkashStep(3)}
                          className="w-full py-2.5 rounded-xl bg-[#e2136e] text-white text-xs font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                        >
                          Verify Code →
                        </button>
                      </div>
                    )}
                    {bkashStep === 3 && (
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground block font-medium">Enter bKash PIN (Demo: 12345)</label>
                        <input
                          type="password"
                          placeholder="•••••"
                          value={paymentForm.bkashPin}
                          onChange={(e) => handlePaymentInput("bkashPin", e.target.value.replace(/\D/g, "").slice(0, 5))}
                          className="w-full rounded-xl border border-border bg-muted-bg/50 px-3.5 py-2.5 text-sm text-hero-text text-center tracking-widest focus:outline-none focus:border-[#e2136e]"
                        />
                        <button
                          type="button"
                          disabled={paymentForm.bkashPin !== "12345"}
                          onClick={(e) => handlePlaceOrder(e)}
                          className="w-full py-2.5 rounded-xl bg-[#e2136e] text-white text-xs font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                        >
                          Confirm & Pay ৳{payableAmount}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Nagad Direct Channel */}
                <label className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer select-none transition-all ${
                  checkoutForm.paymentMethod === "nagad"
                    ? "border-[#f37021] bg-[#f37021]/10 text-hero-text shadow-xs"
                    : "border-border bg-card hover:border-border-strong"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="nagad"
                    checked={checkoutForm.paymentMethod === "nagad"}
                    onChange={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "nagad" }))}
                    className="mt-1 accent-[#f37021]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-hero-text">
                        Nagad Wallet
                      </span>
                      <span className="text-[11px] font-semibold bg-[#f37021]/15 text-[#f37021] px-2 py-0.5 rounded-md border border-[#f37021]/30">
                        Postal Pay
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Instant mobile financial settlement through Nagad postal digital wallet.
                    </p>
                  </div>
                </label>

                {/* SSLCommerz Debit / Credit Cards */}
                <label className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer select-none transition-all ${
                  checkoutForm.paymentMethod === "sslcommerz"
                    ? "border-emerald-500 bg-emerald-500/10 text-hero-text shadow-xs"
                    : "border-border bg-card hover:border-border-strong"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="sslcommerz"
                    checked={checkoutForm.paymentMethod === "sslcommerz"}
                    onChange={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "sslcommerz" }))}
                    className="mt-1 accent-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-hero-text">
                        Debit / Credit Cards & Online Banking
                      </span>
                      <span className="text-[11px] font-semibold bg-muted-bg border border-border text-muted-foreground px-2 py-0.5 rounded-md">
                        SSLCommerz
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Redirects securely to Visa, Mastercard, DBBL Nexus, CityTouch, and NetBanking.
                    </p>
                  </div>
                </label>
              </div>

              {/* Legal & Execution Trigger */}
              <div className="pt-4 border-t border-border space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                    className="mt-0.5 rounded-md accent-emerald-600"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    I acknowledge that fresh mangoes are perishable agricultural items and agree to the{" "}
                    <Link href="/legal/terms" className="text-hero-text underline font-medium" target="_blank">Terms of Service</Link>{" "}
                    and{" "}
                    <Link href="/legal/refund" className="text-hero-text underline font-medium" target="_blank">Refund Policy</Link>.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !agreedToTerms}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Order</span>
                      <span className="text-white/80 font-normal">| ৳ {payableAmount.toLocaleString()}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

          {/* =========================================
              RIGHT COLUMN: ORDER SUMMARY
          ========================================= */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            
            <div className="border border-border bg-card rounded-3xl p-6 sm:p-7 shadow-xs">
              
              <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-hero-text" />
                  <h3 className="text-base font-bold text-hero-text">
                    Order Summary
                  </h3>
                </div>
                <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Items Breakdown Table */}
              <div className="border border-border rounded-2xl bg-muted-bg/30 divide-y divide-border text-xs mb-5 overflow-hidden">
                {cartItems.map((item) => {
                  const itemPrice = item.product.sale_price || item.product.price;
                  let multiplier = 1;
                  if (item.selected_weight === "20kg") multiplier = 1.95;
                  else if (item.selected_weight === "5kg") multiplier = 0.55;
                  else if (item.selected_weight === "2kg") multiplier = 0.25;
                  else if (item.selected_weight === "1kg") multiplier = 0.13;
                  const unitPrice = Math.round(itemPrice * multiplier);

                  return (
                    <div key={item.id} className="p-3.5 flex justify-between items-start">
                      <div className="space-y-0.5 pr-2">
                        <p className="font-semibold text-hero-text text-xs truncate max-w-[180px]">{item.product.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.selected_weight} package × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0 font-bold text-hero-text">
                        ৳ {(unitPrice * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Accounting Breakdown */}
              <div className="space-y-2.5 text-xs border-b border-border pb-4 mb-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-hero-text font-semibold">৳ {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount Coupon</span>
                    <span>- ৳ {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee ({deliveryDistrict})</span>
                  <span className="text-hero-text font-semibold">৳ {deliveryCharge}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Taxes</span>
                  <span className="text-hero-text font-semibold">৳ 0.00</span>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-4 rounded-2xl bg-muted-bg/40 border border-border mb-6 flex justify-between items-center">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">
                    Total Amount
                  </span>
                  <span className="text-sm font-bold text-hero-text">
                    Total Payable
                  </span>
                </div>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ৳ {total.toLocaleString()}
                </span>
              </div>

              {/* Promotional Code Input */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. MANGO10)"
                    value={appliedCoupon || promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                    className="flex-1 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-hero-text placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 uppercase transition-all"
                  />
                  {!appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={!promoCode.trim()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
                    >
                      Apply
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { removeCoupon(); setPromoCode(""); }}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">
                    ✓ Coupon &quot;{appliedCoupon}&quot; applied successfully!
                  </p>
                )}
              </div>

            </div>

            {/* Quality & Traceability Badge */}
            <div className="rounded-3xl border border-border p-5 bg-card text-xs space-y-2 text-muted-foreground shadow-xs">
              <div className="flex items-center gap-2 text-hero-text font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>100% Rajshahi Farm Fresh Guarantee</span>
              </div>
              <p className="text-xs leading-relaxed">
                Direct orchard tree-to-cart supply chain. Every batch is 100% natural, carbide-free, and formalin tested before packaging.
              </p>
            </div>

          </div>

        </form>

      </main>

      <Footer />
    </div>
  );
}
