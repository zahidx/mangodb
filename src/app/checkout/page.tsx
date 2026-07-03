"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2,
  Lock,
  Wallet,
  Smartphone
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
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
    clearCart 
  } = useCart();

  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    phone: "",
    address: "",
    paymentMethod: "cod" // "cod" | "sslcommerz"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreatedId, setOrderCreatedId] = useState<string | null>(null);
  const [finalTotal, setFinalTotal] = useState<number>(0);
  const [finalAddress, setFinalAddress] = useState<string>("");
  const [finalItems, setFinalItems] = useState<any[]>([]);

  // Prefill name & phone if logged in
  useEffect(() => {
    if (profile) {
      setCheckoutForm(prev => ({
        ...prev,
        name: profile.full_name || prev.name,
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

    // If real Supabase database table exists, try executing insertion
    const userId = profile?.id && !profile.id.startsWith("demo-") ? profile.id : null;
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
        }
      } catch (dbErr) {
        console.warn("Error saving order to Supabase database:", dbErr);
      }
    }

    // Save order in localStorage for persistence / tracking lookup
    const existingOrders = JSON.parse(localStorage.getItem("mangodb-orders") || "[]");
    localStorage.setItem("mangodb-orders", JSON.stringify([orderData, ...existingOrders]));

    // If online payment selected, simulate the redirect overlay briefly
    if (checkoutForm.paymentMethod !== "cod") {
      const gateNames: Record<string, string> = {
        sslcommerz: "SSLCommerz",
        bkash: "bKash",
        nagad: "Nagad",
        card: "Credit/Debit Card",
        gpay: "Google Pay"
      };
      const gateName = gateNames[checkoutForm.paymentMethod] || "Payment Gateway";
      toast.loading(`Redirecting to ${gateName} Secure Sandbox...`, { id: "payment-load" });
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.dismiss("payment-load");
      toast.success(`${gateName} Payment Successful!`);
    }

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
      <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-[#fbbf24] selection:text-black overflow-x-hidden">
        <Navbar />
        
        {/* Background Orbs */}
        <div className="absolute top-[10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] pointer-events-none" />

        <div className="grow w-full flex flex-col items-center px-4 pt-36 pb-24 relative z-10">
          <main className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-center text-emerald-600 dark:text-[#34d399] mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          
          <div className="space-y-2">
            <h1 className="font-serif-heading text-3xl font-black text-hero-text">Order Confirmed!</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Thank you for shopping at MangoDB. Your fresh mangoes are booked for harvest!
            </p>
          </div>

          <div className="bg-card/50 border border-border/80 backdrop-blur-md rounded-2xl p-6 text-left space-y-4 font-sans shadow-sm">
            <div className="flex justify-between text-xs border-b border-border pb-3">
              <span className="text-muted-foreground font-medium">Tracking Order ID</span>
              <strong className="text-hero-text font-black text-sm uppercase">{orderCreatedId}</strong>
            </div>
            <div className="flex justify-between text-xs border-b border-border/50 pb-3">
              <span className="text-muted-foreground font-medium">Shipping To</span>
              <span className="text-hero-text font-bold text-right max-w-[200px] truncate">{finalAddress}</span>
            </div>
            <div className="flex justify-between text-xs border-b border-border/50 pb-3">
              <span className="text-muted-foreground font-medium">Ordered Items</span>
              <div className="flex flex-col items-end gap-1 text-right">
                {finalItems.map((item, idx) => (
                  <span key={idx} className="text-hero-text font-semibold text-[11px] block">
                    {item.product.name} ({item.selected_weight} × {item.quantity})
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">Billing Total</span>
              <strong className="text-[#fbbf24] font-black text-sm">৳{finalTotal}</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">Payment Mode</span>
              <span className="text-emerald-500 font-bold capitalize">{checkoutForm.paymentMethod === "cod" ? "Cash On Delivery" : "Online Payment"}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Please save your Order ID above to track delivery. You can check order status inside your customer profile dashboard as well.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/track?id=${orderCreatedId}`}
              className="grow py-3 text-center bg-card border border-border hover:border-emerald-500/20 rounded-xl text-xs font-bold text-hero-text transition-all"
            >
              Track Order Crate
            </Link>
            <Link
              href={profile ? "/dashboard" : "/products"}
              className="grow py-3 text-center bg-[#fbbf24] hover:bg-[#f59e0b] rounded-xl text-xs font-black text-black transition-all shadow-md"
            >
              {profile ? "Go to Dashboard" : "Continue Shopping"}
            </Link>
          </div>
        </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-[#fbbf24] selection:text-black overflow-x-hidden">
      <Navbar />

      <div className="absolute top-[10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full flex justify-center">
        <main className="grow max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-32 pb-24 relative z-10 space-y-8">
        
        {/* Header Block */}
        <div className="border-b border-border pb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-serif-heading text-3xl font-black text-hero-text">Shipping Checkout</h1>
            <p className="text-xs text-muted-foreground">Provide delivery address details and complete payment.</p>
          </div>
          <Link 
            href="/cart" 
            className="flex items-center gap-2 text-xs font-bold text-muted hover:text-hero-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Crate
          </Link>
        </div>

        {/* Content columns */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Checkout Shipping Form */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-8 space-y-6">
            <div className="bg-card/50 backdrop-blur-md border border-border/60 rounded-3xl p-6 space-y-6 shadow-sm font-sans">
              <h2 className="font-serif-heading text-lg font-bold text-hero-text border-b border-border pb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                Shipping & Delivery Address
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={checkoutForm.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-xs font-semibold text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">
                    Phone Number (BD)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={checkoutForm.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 01754309016"
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-xs font-semibold text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">
                  Detailed Delivery Address
                </label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  value={checkoutForm.address}
                  onChange={handleInputChange}
                  placeholder="Street name, holding number, apartment floor, area landmark..."
                  className="w-full bg-card border border-border rounded-xl p-4 text-xs font-semibold text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-card/50 backdrop-blur-md border border-border/60 rounded-3xl p-6 space-y-6 shadow-sm font-sans">
              <h2 className="font-serif-heading text-lg font-bold text-hero-text border-b border-border pb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                Select Payment Mode
              </h2>

              <div className="grid sm:grid-cols-2 gap-3">
                {/* Cash on Delivery */}
                <button
                  type="button"
                  onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "cod" }))}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    checkoutForm.paymentMethod === "cod"
                      ? "bg-emerald-500/5 border-emerald-500/30 text-hero-text ring-2 ring-emerald-500/10"
                      : "bg-card border-border text-muted hover:text-hero-text hover:border-emerald-500/10"
                  }`}
                >
                  <Wallet className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-hero-text">Cash on Delivery (COD)</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">Pay directly to the delivery person.</p>
                  </div>
                </button>

                {/* bKash */}
                <button
                  type="button"
                  onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "bkash" }))}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    checkoutForm.paymentMethod === "bkash"
                      ? "bg-pink-500/5 border-pink-500/30 text-hero-text ring-2 ring-pink-500/10"
                      : "bg-card border-border text-muted hover:text-hero-text hover:border-pink-500/10"
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-pink-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-hero-text">bKash Mobile Menu</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">Pay securely via bKash app or USSD.</p>
                  </div>
                </button>

                {/* Nagad */}
                <button
                  type="button"
                  onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "nagad" }))}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    checkoutForm.paymentMethod === "nagad"
                      ? "bg-orange-500/5 border-orange-500/30 text-hero-text ring-2 ring-orange-500/10"
                      : "bg-card border-border text-muted hover:text-hero-text hover:border-orange-500/10"
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-orange-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-hero-text">Nagad Payment</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">Fast and secure Nagad digital payment.</p>
                  </div>
                </button>

                {/* Credit/Debit Cards */}
                <button
                  type="button"
                  onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "card" }))}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    checkoutForm.paymentMethod === "card"
                      ? "bg-blue-500/5 border-blue-500/30 text-hero-text ring-2 ring-blue-500/10"
                      : "bg-card border-border text-muted hover:text-hero-text hover:border-blue-500/10"
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-hero-text">Credit / Debit Card</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">Visa, MasterCard, Amex via secure gateway.</p>
                  </div>
                </button>

                {/* GPay */}
                <button
                  type="button"
                  onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "gpay" }))}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    checkoutForm.paymentMethod === "gpay"
                      ? "bg-[#4285F4]/5 border-[#4285F4]/30 text-hero-text ring-2 ring-[#4285F4]/10"
                      : "bg-card border-border text-muted hover:text-hero-text hover:border-[#4285F4]/10"
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-[#4285F4] shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-hero-text">Google Pay</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">One-tap checkout with Google Pay.</p>
                  </div>
                </button>

                {/* SSLCommerz Sandbox */}
                <button
                  type="button"
                  onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "sslcommerz" }))}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    checkoutForm.paymentMethod === "sslcommerz"
                      ? "bg-[#fbbf24]/5 border-[#fbbf24]/30 text-hero-text ring-2 ring-[#fbbf24]/10"
                      : "bg-card border-border text-muted hover:text-hero-text hover:border-emerald-500/10"
                  }`}
                >
                  <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-hero-text">SSLCommerz</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">All-in-one payment gateway for BD.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-between border-t border-border pt-6 font-sans">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                256-Bit SSL Secured Checkout
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] border border-[#fbbf24]/20 hover:shadow-[0_0_15px_rgba(251,191,36,0.2)] text-black font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 tracking-wider uppercase font-sans shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Crate Order
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Column: Mini Invoice summary */}
          <div className="lg:col-span-4 bg-card/60 backdrop-blur-md border border-border/80 rounded-3xl p-6 space-y-6 shadow-sm sticky top-24 font-sans">
            <h3 className="font-bold text-hero-text text-base border-b border-border pb-4 font-serif-heading">
              Order Details
            </h3>

            {/* List of items */}
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
              {cartItems.map((item) => {
                const itemPrice = item.product.sale_price || item.product.price;
                let multiplier = 1;
                if (item.selected_weight === "5kg") multiplier = 0.55;
                else if (item.selected_weight === "2kg") multiplier = 0.25;
                else if (item.selected_weight === "1kg") multiplier = 0.13;
                const unitPrice = Math.round(itemPrice * multiplier);

                return (
                  <div key={item.id} className="flex justify-between items-center gap-3 text-xs">
                    <div className="truncate pr-4 space-y-0.5 max-w-[160px]">
                      <p className="font-bold text-hero-text truncate">{item.product.name}</p>
                      <p className="text-[9px] text-muted-foreground font-black">
                        {item.selected_weight} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-hero-text text-right">
                      ৳{unitPrice * item.quantity}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Sum stats */}
            <div className="space-y-3 border-t border-border pt-4 text-xs font-sans font-medium text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-hero-text">৳{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-[#34d399]">
                  <span>Coupon Discount</span>
                  <span>-৳{discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge ({deliveryDistrict})</span>
                <span className="text-hero-text">৳{deliveryCharge}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-hero-text border-t border-border pt-3.5">
                <span>Billing Total</span>
                <span className="text-xl font-black text-[#fbbf24]">৳{total}</span>
              </div>
            </div>
          </div>

        </div>
      </main>
      </div>

      <Footer />
    </div>
  );
}
