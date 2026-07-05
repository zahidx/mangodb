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
    Wallet
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
    subtotal, 
    deliveryCharge, 
    discount, 
    total, 
    deliveryDistrict, 
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
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "cod" // "cod" | "sslcommerz"
  });

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
    if (cartItems.length === 0 && !orderCreatedId && !isSubmitting) {
      toast.error("Your cart is empty");
      router.push("/products");
    }
  }, [cartItems, orderCreatedId, isSubmitting]);

  // Scroll to top when order is successfully placed to show confirmation card
  useEffect(() => {
    if (orderCreatedId) {
      window.scrollTo(0, 0);
    }
  }, [orderCreatedId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCheckoutForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutForm.name.trim() || !checkoutForm.phone.trim() || !checkoutForm.address.trim()) {
      toast.error("Please fill in all shipping fields");
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
        city: deliveryDistrict,
        state: "BD",
        postal_code: "1000",
        country: "Bangladesh",
        phone: checkoutForm.phone,
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="grow flex items-center justify-center px-4 py-16">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Confirmed!</h1>
            <p className="text-sm text-gray-500 mb-6">Thank you for shopping at MangoDB. Your fresh mangoes are booked for harvest!</p>

            <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order ID</span>
                <strong className="text-gray-900 font-mono tracking-wider">{orderCreatedId}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping To</span>
                <span className="text-gray-900 font-medium text-right max-w-50 truncate">{finalAddress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items</span>
                <div className="text-right">
                  {finalItems.map((item, idx) => (
                    <span key={idx} className="text-gray-900 font-medium text-xs block">
                      {item.product.name} ({item.selected_weight} × {item.quantity})
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <strong className="text-emerald-600 text-lg">৳ {finalTotal.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment</span>
                <span className="text-gray-900 font-medium capitalize">{checkoutForm.paymentMethod === "cod" ? "Cash On Delivery" : "Online Payment"}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              {profile && !profile.id.startsWith("demo-")
                ? "You can view all your orders in your dashboard."
                : `A confirmation has been sent to ${checkoutForm.email}. Save your Order ID to track delivery.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href={`/invoice/${orderCreatedId}`} className="flex-1 py-2.5 text-center border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                📄 Download Invoice
              </Link>
              <Link href={`/track?id=${orderCreatedId}`} className="flex-1 py-2.5 text-center border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Track Order
              </Link>
              <Link href={profile && !profile.id.startsWith("demo-") ? "/dashboard" : "/products"} className="flex-1 py-2.5 text-center bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-semibold text-white transition-colors">
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* === PROGRESS STEPS === */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center">
                <Truck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-900 hidden sm:inline">Shipping</span>
            </div>
            <div className="w-8 sm:w-12 h-px bg-emerald-600" />
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${checkoutForm.paymentMethod ? "bg-emerald-600" : "bg-gray-300"}`}>
                <CreditCard className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-900 hidden sm:inline">Payment</span>
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

      {/* === MAIN CONTENT === */}
      <div className="grow max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <p className="text-sm text-gray-500 mt-0.5">Complete your order in a few steps</p>
          </div>
          <Link href="/cart" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* === LEFT COLUMN: FORM === */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-5">

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Shipping Address</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={checkoutForm.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={checkoutForm.phone}
                    onChange={handleInputChange}
                    placeholder="01XXXXXXXXX"
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={checkoutForm.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">We'll send your order receipt to this email.</p>
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
                        className={`px-3 py-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-left ${
                          addr.is_default
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                            : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600"
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
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  value={checkoutForm.address}
                  onChange={handleInputChange}
                  placeholder="House/Flat No., Road, Area, City"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Payment Method</h2>
              </div>

              <div className="space-y-5">
                {/* Saved Payment Methods */}
                {savedPaymentMethods.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Saved Methods</p>
                    <div className="space-y-2">
                      {savedPaymentMethods.map(method => (
                        <label key={method.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          checkoutForm.paymentMethod === `saved-${method.id}`
                            ? "border-purple-300 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
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
                              <span className="text-sm font-semibold text-gray-900 capitalize">{method.provider}</span>
                              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-px rounded-full font-semibold">Saved</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{method.account_details}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="h-px bg-gray-200 my-4" />
                  </div>
                )}

                {/* ===== MOBILE BANKING ===== */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Mobile Banking</p>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {[
                      { id: "bkash", label: "bKash", color: "pink", desc: "Send Money / USSD" },
                      { id: "nagad", label: "Nagad", color: "orange", desc: "Digital Wallet" },
                      { id: "rocket", label: "Rocket", color: "red", desc: "DBBL Mobile" },
                    ].map(opt => (
                      <label key={opt.id} className={`flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checkoutForm.paymentMethod === opt.id
                          ? `border-${opt.color}-300 bg-${opt.color}-50`
                          : "border-gray-200 hover:border-gray-300"
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
                        <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                        <span className="text-[10px] text-gray-400">{opt.desc}</span>
                      </label>
                    ))}
                  </div>

                  {/* === bKash Payment Gateway === */}
                  {checkoutForm.paymentMethod === "bkash" && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-pink-200 shadow-sm">
                      {/* Gateway Header */}
                      <div className="bg-pink-500 px-5 py-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-base">bK</div>
                        <div>
                          <p className="text-white font-bold text-sm">bKash Payment Gateway</p>
                          <p className="text-pink-100 text-[10px]">Secured by SSLCommerz</p>
                        </div>
                      </div>

                      {/* Gateway Body */}
                      <div className="bg-white p-5 space-y-5">
                        {/* Order Info */}
                        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200">
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-gray-200">
                            <span className="text-gray-500">Merchant</span>
                            <span className="font-semibold text-gray-900">MangoDB</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-gray-200">
                            <span className="text-gray-500">Order Reference</span>
                            <span className="font-semibold text-gray-900">MNG-{Math.floor(100000 + Math.random() * 900000)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-gray-200">
                            <span className="text-gray-500">Send to (Merchant)</span>
                            <span className="font-semibold text-gray-900 tracking-wider">+880 1700-000000</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Amount</span>
                            <span className="font-bold text-pink-600 text-base">৳ {total.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Instruction */}
                        <div className="bg-pink-50 rounded-lg p-3.5 text-center border border-pink-100">
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
                                className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 font-mono tracking-wider"
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
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
                            />
                          </div>
                        </div>

                        {/* Pay Button */}
                        <button
                          type="button"
                          disabled={paymentForm.bkashTrxId.length < 5 || paymentForm.bkashPin.length !== 4}
                          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
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
                    <div className="mt-4 overflow-hidden rounded-xl border border-orange-200 shadow-sm">
                      {/* Gateway Header */}
                      <div className="bg-orange-500 px-5 py-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-base">NG</div>
                        <div>
                          <p className="text-white font-bold text-sm">Nagad Payment Gateway</p>
                          <p className="text-orange-100 text-[10px]">Secured by SSLCommerz</p>
                        </div>
                      </div>

                      {/* Gateway Body */}
                      <div className="bg-white p-5 space-y-5">
                        {/* Order Info */}
                        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200">
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-gray-200">
                            <span className="text-gray-500">Merchant</span>
                            <span className="font-semibold text-gray-900">MangoDB</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-gray-200">
                            <span className="text-gray-500">Merchant Account</span>
                            <span className="font-semibold text-gray-900 tracking-wider">+880 1700-000001</span>
                          </div>
                          <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-200 mb-2">
                            <span className="text-gray-500">Reference</span>
                            <span className="font-semibold text-gray-900">ORD-{Math.floor(10000 + Math.random() * 90000)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Amount</span>
                            <span className="font-bold text-orange-600 text-base">৳ {total.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Instruction */}
                        <div className="bg-orange-50 rounded-lg p-3.5 text-center border border-orange-100">
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
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
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
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                            />
                          </div>
                        </div>

                        {/* Pay Button */}
                        <button
                          type="button"
                          disabled={paymentForm.nagadAccount.length !== 11 || paymentForm.nagadPin.length !== 4}
                          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
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

                  {/* === Rocket Payment Gateway === */}
                  {checkoutForm.paymentMethod === "rocket" && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-red-200 shadow-sm">
                      {/* Gateway Header */}
                      <div className="bg-red-500 px-5 py-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-base">R</div>
                        <div>
                          <p className="text-white font-bold text-sm">Rocket (DBBL) Payment Gateway</p>
                          <p className="text-red-100 text-[10px]">Secured by SSLCommerz</p>
                        </div>
                      </div>

                      {/* Gateway Body */}
                      <div className="bg-white p-5 space-y-5">
                        {/* Order Info */}
                        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200">
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-gray-200">
                            <span className="text-gray-500">Merchant</span>
                            <span className="font-semibold text-gray-900">MangoDB</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-gray-200">
                            <span className="text-gray-500">Merchant Wallet</span>
                            <span className="font-semibold text-gray-900 tracking-wider">+880 1700-000002</span>
                          </div>
                          <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-200 mb-2">
                            <span className="text-gray-500">Reference</span>
                            <span className="font-semibold text-gray-900">ORD-{Math.floor(10000 + Math.random() * 90000)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Amount</span>
                            <span className="font-bold text-red-600 text-base">৳ {total.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Instruction */}
                        <div className="bg-red-50 rounded-lg p-3.5 text-center border border-red-100">
                          <p className="text-xs text-red-800 font-medium">
                            Open your Rocket app, go to <strong>Send Money</strong>, send to the merchant wallet above, then enter your details below.
                          </p>
                        </div>

                        {/* Payment Form */}
                        <div className="space-y-3.5">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Your Rocket Wallet Number</label>
                            <input
                              type="text"
                              placeholder="01XXXXXXXXX"
                              value={paymentForm.rocketWallet}
                              onChange={(e) => handlePaymentInput("rocketWallet", e.target.value.replace(/\D/g, "").slice(0, 11))}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Rocket PIN</label>
                            <input
                              type="password"
                              placeholder="Enter your 4-digit PIN"
                              maxLength={4}
                              value={paymentForm.rocketPin}
                              onChange={(e) => handlePaymentInput("rocketPin", e.target.value.replace(/\D/g, "").slice(0, 4))}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                            />
                          </div>
                        </div>

                        {/* Pay Button */}
                        <button
                          type="button"
                          disabled={paymentForm.rocketWallet.length !== 11 || paymentForm.rocketPin.length !== 4}
                          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            paymentForm.rocketWallet.length === 11 && paymentForm.rocketPin.length === 4
                              ? "bg-red-500 hover:bg-red-600 text-white shadow-sm cursor-pointer"
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

                {/* ===== CARDS & GATEWAYS ===== */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Cards & Gateways</p>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {[
                      { id: "card", label: "Credit/Debit Card", color: "blue", desc: "Visa · MC · Amex" },
                      { id: "gpay", label: "Google Pay", color: "sky", desc: "Tap & Pay" },
                      { id: "sslcommerz", label: "SSLCommerz", color: "amber", desc: "All BD Gateways" },
                    ].map(opt => (
                      <label key={opt.id} className={`flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checkoutForm.paymentMethod === opt.id
                          ? `border-${opt.color}-300 bg-${opt.color}-50`
                          : "border-gray-200 hover:border-gray-300"
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
                        <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                        <span className="text-[10px] text-gray-400">{opt.desc}</span>
                      </label>
                    ))}
                  </div>

                  {/* === Credit/Debit Card Gateway === */}
                  {checkoutForm.paymentMethod === "card" && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-blue-200 shadow-sm">
                      <div className="bg-blue-600 px-5 py-3.5 flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-white" />
                        <div>
                          <p className="text-white font-bold text-sm">Card Payment Gateway</p>
                          <p className="text-blue-200 text-[10px]">Visa · MasterCard · Amex</p>
                        </div>
                      </div>

                      <div className="bg-white p-5 space-y-5">
                        {/* Card Preview */}
                        <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-xl p-5 text-white shadow-lg">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex gap-1.5">
                              <div className="w-8 h-5 rounded bg-linear-to-r from-yellow-400 to-yellow-500 opacity-60" />
                              <div className="w-8 h-5 rounded bg-linear-to-r from-red-400 to-red-500 opacity-60" />
                            </div>
                            <span className="text-[9px] uppercase tracking-[0.15em] opacity-70 font-semibold">{cardBrand || "Credit"}</span>
                          </div>
                          <p className="text-xl font-mono tracking-[0.2em] mb-5">
                            {paymentForm.cardNumber || "••••  ••••  ••••  ••••"}
                          </p>
                          <div className="flex gap-8 text-[10px]">
                            <div>
                              <p className="opacity-50 text-[8px] uppercase tracking-wider">Expires</p>
                              <p className="font-mono tracking-wider mt-0.5">{paymentForm.cardExpiry || "MM/YY"}</p>
                            </div>
                            <div>
                              <p className="opacity-50 text-[8px] uppercase tracking-wider">CVV</p>
                              <p className="font-mono tracking-wider mt-0.5">{paymentForm.cardCvv ? "•••" : "•••"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-3.5">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Card Number</label>
                            <input
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              value={paymentForm.cardNumber}
                              onChange={(e) => {
                                const formatted = formatCardNumber(e.target.value);
                                handlePaymentInput("cardNumber", formatted);
                                setCardBrand(detectCardBrand(formatted));
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono tracking-wider"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Expiry Date</label>
                              <input
                                type="text"
                                placeholder="MM/YY"
                                value={paymentForm.cardExpiry}
                                onChange={(e) => handlePaymentInput("cardExpiry", formatExpiry(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">CVV</label>
                              <input
                                type="password"
                                placeholder="•••"
                                maxLength={4}
                                value={paymentForm.cardCvv}
                                onChange={(e) => handlePaymentInput("cardCvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Cardholder Name</label>
                            <input
                              type="text"
                              placeholder="John Doe"
                              value={paymentForm.cardName}
                              onChange={(e) => handlePaymentInput("cardName", e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            />
                          </div>
                        </div>

                        {/* Pay Button */}
                        <button
                          type="button"
                          disabled={paymentForm.cardNumber.replace(/\s/g, "").length !== 16 || paymentForm.cardExpiry.length !== 5 || paymentForm.cardCvv.length < 3}
                          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            paymentForm.cardNumber.replace(/\s/g, "").length === 16 && paymentForm.cardExpiry.length === 5 && paymentForm.cardCvv.length >= 3
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Pay ৳ {total.toLocaleString()}
                        </button>

                        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit SSL</span>
                          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> PCI DSS Compliant</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === Google Pay Gateway === */}
                  {checkoutForm.paymentMethod === "gpay" && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                      <div className="bg-gray-900 px-5 py-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                          <span className="text-lg font-bold text-[#4285F4]">G⁺</span>
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">Google Pay</p>
                          <p className="text-gray-400 text-[10px]">Fast, secure, tokenized payments</p>
                        </div>
                      </div>

                      <div className="bg-white p-5 space-y-5">
                        {!paymentForm.gpayReady ? (
                          <>
                            {/* Order Summary */}
                            <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200">
                              <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-gray-200">
                                <span className="text-gray-500">Merchant</span>
                                <span className="font-semibold text-gray-900">MangoDB</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Amount</span>
                                <span className="font-bold text-gray-900 text-base">৳ {total.toLocaleString()}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setGpayLoading(true);
                                setTimeout(() => {
                                  setGpayLoading(false);
                                  setPaymentForm(prev => ({ ...prev, gpayReady: true }));
                                }, 1800);
                              }}
                              disabled={gpayLoading}
                              className="w-full py-3.5 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2.5 shadow-sm"
                            >
                              {gpayLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Connecting to Google Pay...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white"><path d="M22.014 10.26H12.72v3.48h5.3c-.23 1.46-1.12 2.62-2.36 3.43v2.86h3.8c2.24-2.06 3.53-5.09 3.53-8.69 0-.81-.08-1.6-.24-2.34v-.74h.01z" fill="white"/><path d="M12.72 23.97c3.19 0 5.87-1.06 7.82-2.86l-3.8-2.86c-1.05.71-2.4 1.13-4.02 1.13-3.09 0-5.71-2.09-6.65-4.9H2.14v2.95c1.94 3.85 5.98 6.54 10.58 6.54z" fill="white"/><path d="M6.07 14.48c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.33H2.14C1.4 8.83 1 10.5 1 12.2s.4 3.37 1.14 4.87l3.93-2.59z" fill="white"/><path d="M12.72 4.44c1.73 0 3.29.6 4.51 1.77l3.38-3.38C18.56 1.14 15.88 0 12.72 0 8.12 0 4.08 2.69 2.14 6.54l3.93 2.59c.94-2.81 3.56-4.9 6.65-4.9z" fill="white"/></svg>
                                  Pay with Google Pay
                                </>
                              )}
                            </button>

                            <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3" /> Tokenized · Your card number is never shared
                            </p>
                          </>
                        ) : (
                          <div className="text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">Google Pay Ready</p>
                              <p className="text-xs text-gray-500 mt-0.5">Your default payment method is set</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 inline-flex items-center gap-3 mx-auto">
                              <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M22.014 10.26H12.72v3.48h5.3c-.23 1.46-1.12 2.62-2.36 3.43v2.86h3.8c2.24-2.06 3.53-5.09 3.53-8.69 0-.81-.08-1.6-.24-2.34v-.74h.01z" fill="#4285F4"/><path d="M12.72 23.97c3.19 0 5.87-1.06 7.82-2.86l-3.8-2.86c-1.05.71-2.4 1.13-4.02 1.13-3.09 0-5.71-2.09-6.65-4.9H2.14v2.95c1.94 3.85 5.98 6.54 10.58 6.54z" fill="#34A853"/><path d="M6.07 14.48c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.33H2.14C1.4 8.83 1 10.5 1 12.2s.4 3.37 1.14 4.87l3.93-2.59z" fill="#FBBC05"/><path d="M12.72 4.44c1.73 0 3.29.6 4.51 1.77l3.38-3.38C18.56 1.14 15.88 0 12.72 0 8.12 0 4.08 2.69 2.14 6.54l3.93 2.59c.94-2.81 3.56-4.9 6.65-4.9z" fill="#EA4335"/></svg>
                              <div className="text-left">
                                <p className="text-xs text-gray-500">Default Card</p>
                                <p className="text-sm font-semibold text-gray-900">Visa •••• 8942</p>
                              </div>
                            </div>
                            <p className="text-[10px] text-emerald-600 font-medium">Ready to place order</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* === SSLCommerz Gateway === */}
                  {checkoutForm.paymentMethod === "sslcommerz" && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-amber-200 shadow-sm">
                      <div className="bg-amber-500 px-5 py-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">SSLCommerz Payment Gateway</p>
                          <p className="text-amber-100 text-[10px]">Bangladesh's Leading Payment Gateway</p>
                        </div>
                      </div>

                      <div className="bg-white p-5 space-y-5">
                        {/* Order Info */}
                        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200">
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-gray-200">
                            <span className="text-gray-500">Merchant</span>
                            <span className="font-semibold text-gray-900">MangoDB</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mb-2 pb-2 border-b border-gray-200">
                            <span className="text-gray-500">Order ID</span>
                            <span className="font-semibold text-gray-900">MNG-{Math.floor(100000 + Math.random() * 900000)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Total Amount</span>
                            <span className="font-bold text-amber-600 text-base">৳ {total.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Gateway Options */}
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-3">Select your payment option</p>
                          <div className="grid grid-cols-2 gap-2.5">
                            {[
                              { label: "Visa / MasterCard", icon: "💳" },
                              { label: "bKash", icon: "📱" },
                              { label: "Nagad", icon: "📱" },
                              { label: "Rocket", icon: "🚀" },
                              { label: "Internet Banking", icon: "🏦" },
                              { label: "Amex", icon: "💳" },
                            ].map(gw => (
                              <label key={gw.label} className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 bg-white cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-all">
                                <input type="radio" name="sslGateway" defaultChecked={gw.label === "Visa / MasterCard"} className="w-3.5 h-3.5 text-amber-500 focus:ring-amber-400" />
                                <span className="text-sm">{gw.icon}</span>
                                <span className="text-xs font-medium text-gray-700">{gw.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Pay Button */}
                        <button
                          type="button"
                          className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <Lock className="w-4 h-4" />
                          Pay ৳ {total.toLocaleString()} via SSLCommerz
                        </button>

                        {/* Accepted Cards */}
                        <div>
                          <p className="text-[10px] text-gray-400 text-center mb-2">We accept</p>
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-[9px] px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">VISA</span>
                            <span className="text-[9px] px-2 py-1 rounded bg-red-50 text-red-700 font-bold border border-red-200">MC</span>
                            <span className="text-[9px] px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">AMEX</span>
                            <span className="text-[9px] px-2 py-1 rounded bg-gray-50 text-gray-700 font-bold border border-gray-200">bKash</span>
                            <span className="text-[9px] px-2 py-1 rounded bg-gray-50 text-gray-700 font-bold border border-gray-200">Nagad</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit SSL</span>
                          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> PCI DSS Compliant</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== CASH ON DELIVERY ===== */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Cash</p>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checkoutForm.paymentMethod === "cod"
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
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
                        <span className="text-sm font-semibold text-gray-900">Cash on Delivery (COD)</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-px rounded-full font-semibold">No Fees</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Pay with cash when your order arrives at your doorstep.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-emerald-600" />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Terms & Submit */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  required
                />
                <span className="text-xs text-gray-500 leading-relaxed">
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
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors shadow-sm flex items-center gap-2"
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
          </form>

          {/* === RIGHT COLUMN: ORDER SUMMARY === */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h3 className="text-base font-bold text-gray-900 mb-5 pb-4 border-b border-gray-200">Order Summary</h3>

              {/* Cart Items */}
              <div className="space-y-3 max-h-70 overflow-y-auto mb-4">
                {cartItems.map((item) => {
                  const itemPrice = item.product.sale_price || item.product.price;
                  let multiplier = 1;
                  if (item.selected_weight === "5kg") multiplier = 0.55;
                  else if (item.selected_weight === "2kg") multiplier = 0.25;
                  else if (item.selected_weight === "1kg") multiplier = 0.13;
                  const unitPrice = Math.round(itemPrice * multiplier);

                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🥭</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400">{item.selected_weight} × {item.quantity}</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 shrink-0">
                        ৳ {unitPrice * item.quantity}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Available Coupons */}
              {availableCoupons.length > 0 && !appliedCoupon && (
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Available Offers</label>
                  <div className="flex flex-wrap gap-2">
                    {availableCoupons.map((c: any) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { setPromoCode(c.code); handleApplyCoupon(); }}
                        className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer text-left"
                      >
                        <span className="block uppercase">{c.code}</span>
                        <span className="text-[10px] font-medium text-emerald-500">
                          {c.discount_type === "percentage" ? `${c.discount_value}% OFF` : `৳${c.discount_value} OFF`}
                          {c.min_order_amount > 0 && ` • Min ৳${c.min_order_amount}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Promo Code */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <label className="text-xs font-semibold text-gray-700 block mb-2">Promo Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={appliedCoupon || promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    disabled={!!appliedCoupon}
                  />
                  {!appliedCoupon ? (
                    <button type="button" onClick={handleApplyCoupon} disabled={!promoCode.trim()} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors">
                      Apply
                    </button>
                  ) : (
                    <button type="button" onClick={() => { removeCoupon(); setPromoCode(""); }} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors">
                      Remove
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-emerald-600 font-medium mt-1.5">✓ Coupon "{appliedCoupon}" applied!</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900 font-medium">৳ {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-emerald-600">Discount</span>
                    <span className="text-emerald-600 font-medium">−৳ {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery ({deliveryDistrict})</span>
                  <span className="text-gray-900 font-medium">৳ {deliveryCharge}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-emerald-600">৳ {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-5 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> SSL Secure</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
