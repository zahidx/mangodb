"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  MapPin, 
  Ticket, 
  ArrowLeft,
  X
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

export default function CartPage() {
  const router = useRouter();
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    deliveryCharge, 
    discount, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon, 
    total,
    deliveryDistrict,
    setDeliveryDistrict
  } = useCart();

  const [couponInput, setCouponInput] = useState("");

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = await applyCoupon(couponInput);
    if (success) {
      setCouponInput("");
    }
  };

  const handleCheckoutRedirect = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-[#fbbf24] selection:text-black overflow-x-hidden">
      <Navbar />

      {/* Background Orbs */}
      <div className="absolute top-[10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full flex justify-center">
        <main className="grow max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-32 pb-24 relative z-10 space-y-8">
        
        {/* Header Block */}
        <div className="border-b border-border pb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-serif-heading text-3xl font-black text-hero-text">Your Shopping Crate</h1>
            <p className="text-xs text-muted-foreground">Manage your harvest items before checking out.</p>
          </div>
          <Link 
            href="/products" 
            className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-[#34d399] hover:text-[#fbbf24] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-card/40 backdrop-blur-md border border-border/80 rounded-3xl text-center p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-[#34d399]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-serif-heading text-xl font-bold text-hero-text">Your Crate is Empty</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              You haven't added any fresh Rajshahi mangoes to your shopping crate yet.
            </p>
            <Link
              href="/products"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              Start Browsing Mangoes
            </Link>
          </div>
        ) : (
          /* Cart Content Layout */
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {cartItems.map((item) => {
                const itemPrice = item.product.sale_price || item.product.price;
                let multiplier = 1;
                if (item.selected_weight === "5kg") multiplier = 0.55;
                else if (item.selected_weight === "2kg") multiplier = 0.25;
                else if (item.selected_weight === "1kg") multiplier = 0.13;
                
                const unitPrice = Math.round(itemPrice * multiplier);
                const itemTotal = unitPrice * item.quantity;
                const origin = (item.product.metadata as any)?.origin_district || "Rajshahi";

                return (
                  <div 
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 backdrop-blur-md border border-border/60 rounded-2xl p-5 shadow-sm hover:border-emerald-500/10 transition-all font-sans"
                  >
                    {/* Product Photo & Details */}
                    <div className="flex gap-4 items-center">
                      <Link href={`/products/${item.product.slug}`} className="w-20 h-20 rounded-xl overflow-hidden border border-border/60 shrink-0 block cursor-pointer">
                        <img
                          src={item.product.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="space-y-1">
                        <h3 className="font-serif-heading font-extrabold text-hero-text text-sm hover:text-[#fbbf24] transition-colors">
                          <Link href={`/products/${item.product.slug}`}>{item.product.name}</Link>
                        </h3>
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {origin}
                          </span>
                          <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                            {item.selected_weight} Package
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector, Price & Delete */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-8 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                      {/* Quantity */}
                      <div className="flex items-center bg-card border border-border rounded-xl">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1.5 font-bold hover:text-[#fbbf24] transition-colors cursor-pointer text-xs"
                        >
                          -
                        </button>
                        <span className="px-2 font-black text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1.5 font-bold hover:text-[#fbbf24] transition-colors cursor-pointer text-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">৳{unitPrice} each</p>
                        <p className="text-sm font-black text-hero-text">৳{itemTotal}</p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2.5 bg-red-500/15 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/25 transition-all cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary Card */}
            <div className="lg:col-span-4 bg-card/60 backdrop-blur-md border border-border/80 rounded-3xl p-6 space-y-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-hero-text text-base border-b border-border pb-4">
                Crate Summary
              </h3>

              {/* Delivery charge calculator */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Select Delivery District
                </label>
                <select
                  value={deliveryDistrict}
                  onChange={(e) => setDeliveryDistrict(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-hero-text focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="Dhaka">Dhaka (Inside Dhaka ৳120)</option>
                  <option value="Chapai Nawabganj">Chapai Nawabganj (Outside Dhaka ৳200)</option>
                  <option value="Rajshahi">Rajshahi (Outside Dhaka ৳200)</option>
                  <option value="Rangpur">Rangpur (Outside Dhaka ৳200)</option>
                  <option value="Chittagong">Chittagong (Outside Dhaka ৳200)</option>
                  <option value="Sylhet">Sylhet (Outside Dhaka ৳200)</option>
                  <option value="Khulna">Khulna (Outside Dhaka ৳200)</option>
                  <option value="Barisal">Barisal (Outside Dhaka ৳200)</option>
                </select>
              </div>

              {/* Coupon Form */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider block flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-amber-500" />
                  Apply Discount Coupon
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl text-xs font-bold text-[#34d399]">
                    <span>Coupon Applied: {appliedCoupon}</span>
                    <button 
                      onClick={removeCoupon}
                      className="text-red-500 hover:text-red-400 cursor-pointer"
                      title="Remove Coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter MANGO10..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 border border-border rounded-xl bg-card hover:bg-muted-bg text-xs font-bold text-hero-text cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}
                <span className="text-[9px] text-muted-foreground block font-medium">
                  Try typing <strong className="text-hero-text">MANGO10</strong> (10% discount on order).
                </span>
              </div>

              {/* Invoice lines */}
              <div className="space-y-3.5 border-t border-border pt-4 text-xs font-sans font-medium text-muted-foreground">
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
                  <span>Delivery Charge</span>
                  <span className="text-hero-text">৳{deliveryCharge}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-hero-text border-t border-border pt-3.5">
                  <span>Total Amount</span>
                  <span className="text-2xl font-black text-[#fbbf24]">৳{total}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckoutRedirect}
                className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold rounded-2xl shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs tracking-wider uppercase font-sans border border-emerald-500/20"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>

          </div>
        )}
      </main>
      </div>

      <Footer />
    </div>
  );
}
