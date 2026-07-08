"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Loader2,
    Lock,
    ShieldCheck,
    Truck,
    Wallet,
    List,
    Home,
    MapPin,
    Info,
    ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient() as any;
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

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) return;
    const success = await applyCoupon(promoCode);
    if (!success) {
      setPromoCode("");
    }
  };

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
    paymentMethod: "cod" // "cod" | "sslcommerz"
  });

  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "pickup">("home");
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");

  const [geoData, setGeoData] = useState<{ divisions: any[], districts: any[], upazilas: any[] }>({ divisions: [], districts: [], upazilas: [] });
  
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreatedId, setOrderCreatedId] = useState<string | null>(null);
  const [finalTotal, setFinalTotal] = useState<number>(0);
  const [finalAddress, setFinalAddress] = useState<string>("");
  const [finalItems, setFinalItems] = useState<any[]>([]);

  const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  // Dummy payment form fields for realistic UI
  const [paymentForm, setPaymentForm] = useState({
    bkashTrxId: "",
    bkashPin: "",
    nagadAccount: "",
    nagadPin: "",
    rocketWallet: "",
    rocketPin: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    cardName: "",
    gpayReady: false,
  });
  const [gpayLoading, setGpayLoading] = useState(false);
  const [cardBrand, setCardBrand] = useState("");

  const handlePaymentInput = (field: string, value: string) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const detectCardBrand = (num: string) => {
    const clean = num.replace(/\s/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (clean.startsWith("5")) return "MasterCard";
    if (clean.startsWith("3")) return "Amex";
    return "";
  };

  // Load saved payment methods and address
  useEffect(() => {
    async function loadSavedData() {
      if (!profile) return;
      try {
        // Load saved payment methods
        let payments: any[] = [];
        if (!profile.id.startsWith("demo-")) {
          const { data } = await supabase.from("user_payment_methods").select("*").eq("user_id", profile.id).order("is_default", { ascending: false });
          if (data) payments = data;
        } else {
          const stored = localStorage.getItem(`mangodb-payments-${profile.id}`);
          if (stored) payments = JSON.parse(stored);
        }
        setSavedPaymentMethods(payments);
        const defPayment = payments.find(p => p.is_default);
        if (defPayment) {
          setCheckoutForm(prev => ({ ...prev, paymentMethod: `saved-${defPayment.id}` }));
        }

        // Load saved addresses
        let addrs: any[] = [];
        if (!profile.id.startsWith("demo-")) {
          const res = await fetch("/api/user/addresses");
          const json = await res.json();
          if (json.data) addrs = json.data;
        } else {
          const stored = localStorage.getItem(`mangodb-addresses-${profile.id}`);
          if (stored) addrs = JSON.parse(stored);
        }
        setSavedAddresses(addrs);

        // Load available coupons
        try {
          const couponRes = await fetch("/api/coupons");
          const couponJson = await couponRes.json();
          if (couponJson.data) setAvailableCoupons(couponJson.data);
        } catch (_) {}

        // Auto-fill with default address
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
  }, [profile]);

  // Prefill name & phone if logged in
  useEffect(() => {
    if (profile) {
      setCheckoutForm(prev => ({
        ...prev,
        name: profile.full_name || prev.name,
        email: profile.email || prev.email,
        phone: profile.phone || prev.phone
      }));
    }
  }, [profile]);

  // If cart is empty and order wasn't just placed, redirect to shop
  useEffect(() => {
    if (!loading && cartItems.length === 0 && !orderCreatedId && !isSubmitting) {
      toast.error("Your cart is empty");
      router.push("/products");
    }
  }, [cartItems, loading, orderCreatedId, isSubmitting]);

  // Scroll to top when order is successfully placed to show confirmation card
  useEffect(() => {
    if (orderCreatedId) {
      window.scrollTo(0, 0);
    }
  }, [orderCreatedId]);

  const payableAmount = paymentType === "full" ? total : Math.round(total / 2);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "district") {
      // Update delivery district for cart calculation
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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
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
        // @ts-ignore
        upazila: (geoData.upazilas.find((u: any) => u.id === checkoutForm.upazila) as any)?.name || "",
      },
      payment_status: checkoutForm.paymentMethod === "cod" ? "pending" : "paid",
      payment_id: checkoutForm.paymentMethod === "cod" ? null : `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order_items: cartItems.map((item) => {
        const itemPrice = item.product.sale_price || item.product.price;
        let multiplier = 1;
        if (item.selected_weight === "5kg") multiplier = 0.55;
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

    // Determine user / guest ID for persistence
    const isGuest = !profile || profile.id.startsWith("demo-");
    const guestId = isGuest ? `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null;
    const userId = !isGuest ? profile.id : null;

    // If real Supabase database table exists, try executing insertion
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
          // Insert order items
          const itemsToInsert = cartItems.map((item) => {
            const itemPrice = item.product.sale_price || item.product.price;
            let multiplier = 1;
            if (item.selected_weight === "5kg") multiplier = 0.55;
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
          
          // Generate notification
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "Order Placed Successfully",
            message: `Your order #${data.id} has been placed and is being processed.`,
            type: "order_placed"
          });
        } else if (error) {
          console.error("Supabase order insert error:", error);
          toast.error(`Database error: ${error.message}`);
        }
      } catch (dbErr: any) {
        console.error("Error saving order to Supabase database:", dbErr);
        toast.error(`Database connection error: ${dbErr.message || "Failed to save to database"}`);
      }
    }

    // Save order in localStorage for persistence / tracking lookup
    // Use a guest-specific key so guest orders are retrievable by email
    const storageKey = isGuest ? `mangodb-guest-orders` : `mangodb-orders`;
    const existingOrders = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const orderWithMeta = {
      ...orderData,
      _guestEmail: isGuest ? checkoutForm.email : undefined,
      _guestId: guestId,
      _isGuest: isGuest,
    };
    localStorage.setItem(storageKey, JSON.stringify([orderWithMeta, ...existingOrders]));

    // Also index by email for guest tracking lookup
    if (isGuest && checkoutForm.email) {
      const emailKey = `mangodb-guest-orders-by-email`;
      const byEmail = JSON.parse(localStorage.getItem(emailKey) || "{}");
      const email = checkoutForm.email.toLowerCase().trim();
      if (!byEmail[email]) byEmail[email] = [];
      byEmail[email].push(orderId);
      localStorage.setItem(emailKey, JSON.stringify(byEmail));
    }

    if (profile && profile.id.startsWith("demo-")) {
      const storedNotifs = JSON.parse(localStorage.getItem(`mangodb-notifications-${profile.id}`) || "[]");
      const newNotif = {
        id: `notif-${Date.now()}`,
        user_id: profile.id,
        title: "Order Placed Successfully",
        message: `Your order #${orderId} has been placed and is being processed.`,
        type: "order_placed",
        is_read: false,
        created_at: new Date().toISOString()
      };
      localStorage.setItem(`mangodb-notifications-${profile.id}`, JSON.stringify([newNotif, ...storedNotifs]));
    }

    // Trigger transactional email (we do this early so they get the receipt even if they drop off on payment gateway, acting as a pending invoice)
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
        console.error("Failed to send order email:", err);
      }
    }

    // If online payment selected, redirect to SSLCommerz!
    if (checkoutForm.paymentMethod !== "cod") {
      toast.loading(`Redirecting to Secure Payment Gateway...`, { id: "payment-load" });
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
          // Redirect the user to the SSLCommerz hosted sandbox checkout page
          window.location.href = data.url;
          return; // Stop execution here because they are leaving the site
        } else {
          toast.error("Failed to connect to payment gateway.");
          setIsSubmitting(false);
          toast.dismiss("payment-load");
          return;
        }
      } catch (err) {
        console.error("Payment init error:", err);
        toast.error("Payment initialization failed.");
        setIsSubmitting(false);
        toast.dismiss("payment-load");
        return;
      }
    }

    // If COD, show success screen
    setFinalTotal(total);
    setFinalAddress(checkoutForm.address);
    setFinalItems(cartItems);
    setOrderCreatedId(orderId);
    await clearCart();
    setIsSubmitting(false);
    toast.success("Order Placed Successfully!");
  };

  if (orderCreatedId) {
    /* Success Confirmation Screen */
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="grow flex items-center justify-center px-4 py-16">
          <div className="max-w-lg w-full bg-white rounded shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Order Confirmed!</h1>
            <p className="text-sm text-slate-500 mb-6">Thank you for shopping at MangoDB. Your fresh mangoes are booked for harvest!</p>

            <div className="bg-slate-50 rounded p-5 text-left space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Order ID</span>
                <strong className="text-slate-900 font-mono tracking-wider">{orderCreatedId}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shipping To</span>
                <span className="text-slate-900 font-medium text-right max-w-50 truncate">{finalAddress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Items</span>
                <div className="text-right">
                  {finalItems.map((item, idx) => (
                    <span key={idx} className="text-slate-900 font-medium text-xs block">
                      {item.product.name} ({item.selected_weight} × {item.quantity})
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between text-sm">
                <span className="text-slate-500">Total</span>
                <strong className="text-emerald-600 text-lg">৳ {finalTotal.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment</span>
                <span className="text-slate-900 font-medium capitalize">{checkoutForm.paymentMethod === "cod" ? "Cash On Delivery" : "Online Payment"}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              {profile && !profile.id.startsWith("demo-")
                ? "You can view all your orders in your dashboard."
                : `A receipt has been sent to ${checkoutForm.email}. Use your Order ID or email to track delivery.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href={`/invoice/${orderCreatedId}`} className="flex-1 py-2.5 text-center border border-gray-300 rounded-sm text-sm font-medium text-gray-700 hover:bg-slate-50 transition-colors">
                📄 Download Invoice
              </Link>
              <Link href={`/track?id=${orderCreatedId}`} className="flex-1 py-2.5 text-center border border-gray-300 rounded-sm text-sm font-medium text-gray-700 hover:bg-slate-50 transition-colors">
                Track Order
              </Link>
              <Link href={profile && !profile.id.startsWith("demo-") ? "/dashboard" : "/products"} className="flex-1 py-2.5 text-center bg-emerald-600 hover:bg-emerald-700 rounded-sm text-sm font-semibold text-white transition-colors">
                {profile && !profile.id.startsWith("demo-") ? "Go to Dashboard" : "Continue Shopping"}
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* === PROGRESS STEPS === */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center">
                <Truck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-slate-900 hidden sm:inline">Shipping</span>
            </div>
            <div className="w-8 sm:w-12 h-px bg-emerald-600" />
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${checkoutForm.paymentMethod ? "bg-emerald-600" : "bg-gray-300"}`}>
                <CreditCard className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-slate-900 hidden sm:inline">Payment</span>
            </div>
            <div className="w-8 sm:w-12 h-px bg-gray-300" />
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-400 hidden sm:inline">Confirm</span>
            </div>
          </div>
        </div>
      </div>

      {/* === GUEST MODE BANNER === */}
      {(!profile || profile.id.startsWith("demo-")) && (
        <div className="max-w-5xl mx-auto px-4 sm:px-0 pt-6">
          <div className="bg-amber-50 border border-amber-200 rounded p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">Checking out as Guest</p>
              <p className="text-xs text-amber-700 mt-0.5">
                You&apos;re ordering without an account. Save your <strong>Order ID</strong> to track delivery.
                <Link href="/login" className="ml-1 font-semibold underline hover:text-amber-900 transition-colors">Sign in</Link> for a personalized experience.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 px-3 py-1.5 bg-white border border-amber-300 rounded-sm text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors hidden sm:block"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* === MAIN CONTENT === */}
      <div className="grow max-w-5xl w-full mx-auto px-4 sm:px-6 py-12">
        {/* Page Header */}
        <div className="mb-8 flex flex-col items-center sm:items-start text-center sm:text-left">
          <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4 self-start">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
          <div className="flex flex-col items-center sm:items-start w-full">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 sm:hidden">
              <ShoppingBag className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-emerald-600 hidden sm:block" />
              Checkout
            </h1>
            <p className="text-sm text-slate-500 mt-1">Complete your order in a few steps</p>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder} className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">
          {/* === LEFT COLUMN: SHIPPING === */}
          <div className="lg:col-span-7 w-full">

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Customer Information</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Order For <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="orderFor"
                    value={checkoutForm.orderFor}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  >
                    <option value="Self">Self</option>
                    <option value="Gift">Gift / Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={checkoutForm.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={checkoutForm.phone}
                    onChange={handleInputChange}
                    placeholder="01XXXXXXXXX"
                    className="w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={checkoutForm.email}
                    onChange={handleInputChange}
                    placeholder="For order receipt (optional)"
                    className="w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Division <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="division"
                    required
                    value={checkoutForm.division}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  >
                    <option value="">Select Division</option>
                    {geoData.divisions.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="district"
                    required
                    value={checkoutForm.district}
                    onChange={handleInputChange}
                    disabled={!checkoutForm.division}
                    className="w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:bg-slate-100"
                  >
                    <option value="">Select District</option>
                    {geoData.districts.filter((d: any) => d.division_id === checkoutForm.division).map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Upazila <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="upazila"
                    required
                    value={checkoutForm.upazila}
                    onChange={handleInputChange}
                    disabled={!checkoutForm.district}
                    className="w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:bg-slate-100"
                  >
                    <option value="">Select Upazila</option>
                    {geoData.upazilas.filter((u: any) => u.district_id === checkoutForm.district).map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Saved Addresses Selector */}
              {savedAddresses.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Saved Addresses
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
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
                            address: `${addr.street_address}${addr.apartment ? `, ${addr.apartment}` : ""}, ${addr.area}, ${addr.city}, ${addr.state}, ${addr.country}`,
                          }));
                          toast.success(`Using address: ${addr.label || "Home"}`);
                        }}
                        className={`px-3 py-2 rounded-sm border text-[11px] font-bold transition-all cursor-pointer text-left ${
                          addr.is_default
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                            : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
                        }`}
                      >
                        <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-0.5">
                          {addr.label || "Address"}
                          {addr.is_default && " ★ Default"}
                        </span>
                        <span className="block truncate max-w-[200px]">
                          {addr.street_address}, {addr.city}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2">
                    Select a saved address above or type a new one below.
                  </p>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Full Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  value={checkoutForm.address}
                  onChange={handleInputChange}
                  placeholder="House / Building / Area"
                  className="w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Order Notes (optional)
                </label>
                <textarea
                  name="orderNotes"
                  rows={3}
                  value={checkoutForm.orderNotes}
                  onChange={handleInputChange}
                  placeholder="Any special instructions..."
                  className="w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 resize-none"
                />
              </div>
            </div>

          </div>

          {/* === RIGHT COLUMN: ORDER SUMMARY (order-2 on mobile) === */}
          <div className="lg:col-span-5 lg:row-span-4 w-full space-y-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 lg:sticky lg:top-24">
              <div className="flex items-center gap-2 mb-4">
                <List className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-bold text-slate-900">Order Summary</h3>
              </div>

              <div className="mb-4">
                <p className="text-sm text-slate-600 mb-2">Delivery Method</p>
                <div className="flex items-center gap-6">
                   <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="radio" name="deliveryMethod" value="home" checked={deliveryMethod === "home"} onChange={() => setDeliveryMethod("home")} className="w-4 h-4 text-emerald-600 focus:ring-emerald-600" />
                      <Home className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium text-gray-700">Home Delivery</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="radio" name="deliveryMethod" value="pickup" checked={deliveryMethod === "pickup"} onChange={() => setDeliveryMethod("pickup")} className="w-4 h-4 text-emerald-600 focus:ring-emerald-600" />
                      <MapPin className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium text-gray-700">Pickup Point</span>
                   </label>
                </div>
              </div>

              {deliveryMethod === "home" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-3 flex items-start gap-2 mb-4 text-sm text-yellow-800">
                   <Info className="w-4 h-4 shrink-0 mt-0.5 text-yellow-600" />
                   <p>শুধুমাত্র জেলা/উপজেলা শহরের ৫ কিলোমিটারের মধ্যে হোম ডেলিভারি করা যাবে</p>
                </div>
              )}

              <div className="border border-slate-200 rounded overflow-hidden mb-4">
                {/* Cart Items */}
                <div className="p-4 bg-white space-y-3">
                  {cartItems.map((item) => {
                    const itemPrice = item.product.sale_price || item.product.price;
                    let multiplier = 1;
                    if (item.selected_weight === "5kg") multiplier = 0.55;
                    else if (item.selected_weight === "2kg") multiplier = 0.25;
                    else if (item.selected_weight === "1kg") multiplier = 0.13;
                    const unitPrice = Math.round(itemPrice * multiplier);

                    return (
                      <div key={item.id} className="flex justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{item.product.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.selected_weight} × {item.quantity}</p>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 shrink-0">
                          ৳ {unitPrice * item.quantity}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Delivery and Discount Rows */}
                <div className="p-4 bg-white border-t border-gray-100 space-y-3">
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="font-semibold text-emerald-600">Discount</p>
                      </div>
                      <p className="font-semibold text-emerald-600">- ৳ {discount.toLocaleString()}</p>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="font-semibold text-gray-700">Delivery</p>
                      <p className="text-gray-400 text-xs mt-0.5">{deliveryDistrict}</p>
                    </div>
                    <p className="font-semibold text-slate-900">৳ {deliveryCharge}</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 flex justify-between items-center border-t border-emerald-100">
                   <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-gray-800" />
                      <p className="font-bold text-lg text-slate-900">Total</p>
                   </div>
                   <p className="font-bold text-xl text-emerald-700">৳ {total.toLocaleString()}</p>
                </div>
                {paymentType === "partial" && (
                  <div className="p-4 bg-amber-50 flex justify-between items-center border-t border-amber-200">
                     <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-amber-900" />
                        <p className="font-bold text-sm text-slate-900">Payable Now (50%)</p>
                     </div>
                     <p className="font-bold text-lg text-amber-700">৳ {payableAmount.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Promo Code */}
              <div className="pt-2 mb-2">
                <label className="text-xs font-semibold text-gray-700 block mb-2">Promo Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={appliedCoupon || promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 border border-gray-300 rounded-sm px-3 py-2 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    disabled={!!appliedCoupon}
                  />
                  {!appliedCoupon ? (
                    <button type="button" onClick={handleApplyCoupon} disabled={!promoCode.trim()} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium rounded-sm transition-colors cursor-pointer">
                      Apply
                    </button>
                  ) : (
                    <button type="button" onClick={() => { removeCoupon(); setPromoCode(""); }} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-sm transition-colors cursor-pointer">
                      Remove
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-emerald-600 font-medium mt-1.5">✓ Coupon "{appliedCoupon}" applied!</p>
                )}
              </div>

            </div>
          </div>
          {/* === LEFT COLUMN: PAYMENT OPTIONS (order-3) === */}
          <div className="lg:col-span-7 w-full">
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-bold text-slate-900">Payment Options</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className={`flex flex-col border-2 rounded-lg p-4 cursor-pointer select-none transition-colors ${paymentType === 'full' ? 'bg-emerald-50/50 border-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-200'}`}>
                   <div className="flex items-center gap-2 mb-2">
                      <input type="radio" name="paymentType" value="full" checked={paymentType === 'full'} onChange={() => setPaymentType('full')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-600" />
                      <Wallet className={`w-5 h-5 ${paymentType === 'full' ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span className="font-bold text-base text-slate-900">Full Pay</span>
                   </div>
                   <span className="ml-7 text-slate-600 font-medium">৳ {total.toLocaleString()}</span>
                </label>

                <label className={`flex flex-col border-2 rounded-lg p-4 cursor-pointer select-none transition-colors ${paymentType === 'partial' ? 'bg-amber-50/50 border-amber-500' : 'bg-white border-slate-200 hover:border-amber-200'}`}>
                   <div className="flex items-center gap-2 mb-2">
                      <input type="radio" name="paymentType" value="partial" checked={paymentType === 'partial'} onChange={() => setPaymentType('partial')} className="w-4 h-4 text-amber-500 focus:ring-amber-500" />
                      <CreditCard className={`w-5 h-5 ${paymentType === 'partial' ? 'text-amber-600' : 'text-gray-400'}`} />
                      <span className="font-bold text-base text-slate-900">50% Pay</span>
                   </div>
                   <span className="ml-7 text-slate-600 font-medium">৳ {Math.round(total / 2).toLocaleString()}</span>
                </label>
              </div>
            </div>
          </div>

          {/* === LEFT COLUMN: PAYMENT METHOD (order-4) === */}
          <div className="lg:col-span-7 w-full">

            {/* Payment Gateway Method */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Payment Method</h2>
              </div>

              <div className="space-y-5">
                {/* Saved Payment Methods */}
                {savedPaymentMethods.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Saved Methods</p>
                    <div className="space-y-2">
                      {savedPaymentMethods.map(method => (
                        <label key={method.id} className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${
                          checkoutForm.paymentMethod === `saved-${method.id}`
                            ? "border-purple-300 bg-purple-50"
                            : "border-slate-200 hover:border-gray-300"
                        }`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={`saved-${method.id}`}
                            checked={checkoutForm.paymentMethod === `saved-${method.id}`}
                            onChange={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: `saved-${method.id}` }))}
                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900 capitalize">{method.provider}</span>
                              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-px rounded-full font-semibold">Saved</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{method.account_details}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="h-px bg-gray-200 my-4" />
                  </div>
                )}

                {/* ===== MOBILE BANKING ===== */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Mobile Banking</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      { id: "bkash", label: "bKash", color: "pink", desc: "Send Money / USSD" },
                      { id: "nagad", label: "Nagad", color: "orange", desc: "Digital Wallet" },
                    ].map(opt => (
                      <label key={opt.id} className={`flex flex-col items-center gap-3 p-4 rounded border cursor-pointer select-none transition-all duration-200 ${
                        checkoutForm.paymentMethod === opt.id
                          ? `border-${opt.color}-300 bg-${opt.color}-50`
                          : "border-slate-200 hover:border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={opt.id}
                          checked={checkoutForm.paymentMethod === opt.id}
                          onChange={() => { setCheckoutForm(prev => ({ ...prev, paymentMethod: opt.id })); setGpayLoading(false); }}
                          // @ts-ignore
                          className={`w-4 h-4 text-${opt.color}-600 focus:ring-${opt.color}-500`}
                        />
                        <span className="text-sm font-semibold text-slate-900">{opt.label}</span>
                        <span className="text-[10px] text-gray-400">{opt.desc}</span>
                      </label>
                    ))}
                  </div>

                  {/* === bKash Payment Gateway === */}
                  {checkoutForm.paymentMethod === "bkash" && (
                    <div className="mt-4 overflow-hidden rounded border border-pink-200 shadow-sm">
                      {/* Gateway Header */}
                      <div className="bg-pink-500 px-5 py-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-sm bg-white/20 flex items-center justify-center text-white font-black text-base">bK</div>
                        <div>
                          <p className="text-white font-bold text-sm">bKash Payment Gateway</p>
                          <p className="text-pink-100 text-[10px]">Secured by SSLCommerz</p>
                        </div>
                      </div>

                      {/* Gateway Body */}
                      <div className="bg-white p-5 space-y-5">
                        {/* Order Info */}
                        <div className="bg-slate-50 rounded-sm p-3.5 border border-slate-200">
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Merchant</span>
                            <span className="font-semibold text-slate-900">MangoDB</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Order Reference</span>
                            <span className="font-semibold text-slate-900">MNG-{Math.floor(100000 + Math.random() * 900000)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Send to (Merchant)</span>
                            <span className="font-semibold text-slate-900 tracking-wider">+880 1700-000000</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Amount</span>
                            <span className="font-bold text-pink-600 text-base">৳ {payableAmount.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Instruction */}
                        <div className="bg-pink-50 rounded-sm p-3.5 text-center border border-pink-100">
                          <p className="text-xs text-pink-800 font-medium">
                            Open your bKash app, go to <strong>Send Money</strong>, send the exact amount to the merchant number above, then enter the Transaction ID below.
                          </p>
                        </div>

                        {/* Payment Form */}
                        <div className="space-y-3.5">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">bKash Transaction ID</label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="TR1234ABCD"
                                value={paymentForm.bkashTrxId}
                                onChange={(e) => handlePaymentInput("bkashTrxId", e.target.value.toUpperCase())}
                                className="w-full border border-gray-300 rounded-sm pl-3 pr-10 py-2.5 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 font-mono tracking-wider"
                              />
                              {paymentForm.bkashTrxId.length > 0 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded font-semibold">Entered</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">bKash PIN</label>
                            <input
                              type="password"
                              placeholder="Enter your 4-digit PIN"
                              maxLength={4}
                              value={paymentForm.bkashPin}
                              onChange={(e) => handlePaymentInput("bkashPin", e.target.value.replace(/\D/g, "").slice(0, 4))}
                              className="w-full border border-gray-300 rounded-sm px-3 py-2.5 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                            />
                          </div>
                        </div>

                        {/* Pay Button */}
                        <button
                          type="button"
                          disabled={paymentForm.bkashTrxId.length < 5 || paymentForm.bkashPin.length !== 4}
                          className={`w-full py-3 rounded-sm font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            paymentForm.bkashTrxId.length >= 5 && paymentForm.bkashPin.length === 4
                              ? "bg-pink-500 hover:bg-pink-600 text-white shadow-sm cursor-pointer"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Pay ৳ {total.toLocaleString()}
                        </button>

                        {/* Security Footer */}
                        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit SSL</span>
                          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> PCI Compliant</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === Nagad Payment Gateway === */}
                  {checkoutForm.paymentMethod === "nagad" && (
                    <div className="mt-4 overflow-hidden rounded border border-orange-200 shadow-sm">
                      {/* Gateway Header */}
                      <div className="bg-orange-500 px-5 py-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-sm bg-white/20 flex items-center justify-center text-white font-black text-base">NG</div>
                        <div>
                          <p className="text-white font-bold text-sm">Nagad Payment Gateway</p>
                          <p className="text-orange-100 text-[10px]">Secured by SSLCommerz</p>
                        </div>
                      </div>

                      {/* Gateway Body */}
                      <div className="bg-white p-5 space-y-5">
                        {/* Order Info */}
                        <div className="bg-slate-50 rounded-sm p-3.5 border border-slate-200">
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Merchant</span>
                            <span className="font-semibold text-slate-900">MangoDB</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Merchant Account</span>
                            <span className="font-semibold text-slate-900 tracking-wider">+880 1700-000001</span>
                          </div>
                          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200 mb-2">
                            <span className="text-slate-500">Reference</span>
                            <span className="font-semibold text-slate-900">ORD-{Math.floor(10000 + Math.random() * 90000)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Amount</span>
                            <span className="font-bold text-orange-600 text-base">৳ {total.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Instruction */}
                        <div className="bg-orange-50 rounded-sm p-3.5 text-center border border-orange-100">
                          <p className="text-xs text-orange-800 font-medium">
                            Open your Nagad app, go to <strong>Send Money</strong>, send to the merchant account above, then enter your details below.
                          </p>
                        </div>

                        {/* Payment Form */}
                        <div className="space-y-3.5">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Your Nagad Account Number</label>
                            <input
                              type="text"
                              placeholder="01XXXXXXXXX"
                              value={paymentForm.nagadAccount}
                              onChange={(e) => handlePaymentInput("nagadAccount", e.target.value.replace(/\D/g, "").slice(0, 11))}
                              className="w-full border border-gray-300 rounded-sm px-3 py-2.5 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Nagad PIN</label>
                            <input
                              type="password"
                              placeholder="Enter your 4-digit PIN"
                              maxLength={4}
                              value={paymentForm.nagadPin}
                              onChange={(e) => handlePaymentInput("nagadPin", e.target.value.replace(/\D/g, "").slice(0, 4))}
                              className="w-full border border-gray-300 rounded-sm px-3 py-2.5 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                            />
                          </div>
                        </div>

                        {/* Pay Button */}
                        <button
                          type="button"
                          disabled={paymentForm.nagadAccount.length !== 11 || paymentForm.nagadPin.length !== 4}
                          className={`w-full py-3 rounded-sm font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            paymentForm.nagadAccount.length === 11 && paymentForm.nagadPin.length === 4
                              ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm cursor-pointer"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Pay ৳ {total.toLocaleString()}
                        </button>

                        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit SSL</span>
                          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> PCI Compliant</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* ===== CASH ON DELIVERY ===== */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Cash</p>
                  <label className={`flex items-center gap-4 p-4 rounded border cursor-pointer select-none transition-all duration-200 ${
                    checkoutForm.paymentMethod === "cod"
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 hover:border-gray-300"
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={checkoutForm.paymentMethod === "cod"}
                      onChange={() => { setCheckoutForm(prev => ({ ...prev, paymentMethod: "cod" })); setGpayLoading(false); }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">Cash on Delivery (COD)</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-px rounded-full font-semibold">No Fees</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Pay with cash when your order arrives at your doorstep.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-emerald-600" />
                    </div>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* === LEFT COLUMN: TERMS (order-5) === */}
          <div className="lg:col-span-7 w-full">
            {/* Terms & Submit */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  required
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  I agree to the{" "}
                  <Link href="/legal/terms" className="text-emerald-600 hover:underline font-semibold" target="_blank">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/legal/privacy" className="text-emerald-600 hover:underline font-semibold" target="_blank">Privacy Policy</Link>.
                </span>
              </label>

              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Lock className="w-3.5 h-3.5" />
                  Secure SSL Encrypted Checkout
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !agreedToTerms}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded transition-all duration-300 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>
            </div>
          </div>

        </form>
      </div>

      <Footer />
    </div>
  );
}
