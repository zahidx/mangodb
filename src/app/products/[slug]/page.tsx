"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import { getProductBySlug, getProductReviews, getProducts } from "@/lib/supabase/queries";
import type { Product, Review } from "@/types/database";
import {
    ArrowLeft,
    Award,
    Heart,
    Loader2,
    MapPin,
    Scale,
    Send,
    ShieldCheck,
    ShoppingBag,
    Star,
    Truck,
    User,
    X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const { addToCart } = useCart();
  const { profile } = useAuth();
  const supabase = createClient() as any;

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector states
  const [selectedWeight, setSelectedWeight] = useState<string>("10kg");
  const [quantity, setQuantity] = useState<number>(1);
  const [isWished, setIsWished] = useState(false);

  // Review form states
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      if (!slug) return;
      setLoading(true);
      try {
        const prodRes = await getProductBySlug(slug);
        if (prodRes.data) {
          setProduct(prodRes.data);
          
          // Load wishlist state
          const savedWish = localStorage.getItem("mangodb-wishlist");
          if (savedWish) {
            try {
              const list = JSON.parse(savedWish);
              setIsWished(list.includes(prodRes.data.id));
            } catch (e) {}
          }

          // Fetch reviews and related products
          const [revRes, relRes] = await Promise.all([
            getProductReviews(prodRes.data.id),
            getProducts({ categorySlug: prodRes.data.category?.slug, limit: 4 })
          ]);

          if (revRes.data) setReviews(revRes.data);
          if (relRes.data) {
            // Exclude current product from related
            setRelatedProducts(relRes.data.filter((p: any) => p.id !== prodRes.data.id));
          }

          // Set default selected weight from metadata
          const weightOpts = (prodRes.data.metadata as any)?.weight_options;
          if (Array.isArray(weightOpts) && weightOpts.length > 0) {
            setSelectedWeight(weightOpts[0]);
          }
        } else {
          toast.error("Product not found");
        }
      } catch (error) {
        toast.error("Failed to load details");
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [slug]);

  const toggleWishlist = () => {
    if (!product) return;
    const savedWish = localStorage.getItem("mangodb-wishlist");
    let list: string[] = [];
    if (savedWish) {
      try { list = JSON.parse(savedWish); } catch (e) {}
    }

    if (isWished) {
      list = list.filter(id => id !== product.id);
      setIsWished(false);
      toast.success("Removed from wishlist");
    } else {
      list.push(product.id);
      setIsWished(true);
      toast.success("Added to wishlist");
    }
    localStorage.setItem("mangodb-wishlist", JSON.stringify(list));
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity, selectedWeight);
    toast.success("Redirecting to checkout...");
    router.push("/checkout");
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!profile) {
      toast.error("Please log in to submit a review");
      router.push("/login");
      return;
    }

    setSubmittingReview(true);
    
    const newReviewData = {
      id: `rev-${Math.random()}`,
      user_id: profile.id,
      product_id: product.id,
      rating,
      comment: comment.trim(),
      is_approved: false,
      created_at: new Date().toISOString(),
      profile: {
        id: profile.id,
        full_name: profile.full_name || "Premium Customer",
        avatar_url: profile.avatar_url,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        dob: null,
        gender: null,
        country: null,
        city: null,
        is_blocked: false,
        created_at: "",
        updated_at: ""
      }
    };

    // If logged in via Supabase, write to database
    if (!profile.id.startsWith("demo-")) {
      try {
        await supabase.from("reviews").insert({
          user_id: profile.id,
          product_id: product.id,
          rating,
          comment: comment.trim(),
        });
      } catch (dbErr) {
        console.warn("Could not write review in DB, saving locally only");
      }
    }

    setReviews([newReviewData, ...reviews]);
    setComment("");
    toast.success("Review submitted!");
    setSubmittingReview(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <Navbar />
        <div className="grow flex items-center justify-center flex-col gap-3 pt-20">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-muted-foreground font-bold">Loading product details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <Navbar />
        <div className="grow flex items-center justify-center flex-col gap-4 pt-20 text-center px-4">
          <span className="text-6xl">🥭</span>
          <h2 className="font-serif-heading text-2xl font-bold text-hero-text">Product Not Found</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            We couldn't find the mango variety you are looking for. It might be out of season.
          </p>
          <Link
            href="/products"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 hover:bg-emerald-500/20 text-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate scaled price based on weight:
  // Base price is usually for 10kg crate.
  // 5kg box: 55% of price
  // 2kg box: 25% of price
  // 1kg pouch: 13% of price
  const basePrice = product.sale_price || product.price;
  let multiplier = 1;
  if (selectedWeight === "5kg") multiplier = 0.55;
  else if (selectedWeight === "2kg") multiplier = 0.25;
  else if (selectedWeight === "1kg") multiplier = 0.13;
  const scaledPrice = Math.round(basePrice * multiplier);
  
  const origin = (product.metadata as any)?.origin_district || "Rajshahi";
  const badge = (product.metadata as any)?.badge;
  const weightOpts = (product.metadata as any)?.weight_options || ["5kg", "10kg"];

  // Average Rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "4.8";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-[#fbbf24] selection:text-black overflow-x-hidden">
      <Navbar />

      {/* Background Orbs */}
      <div className="absolute top-[15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute top-[50%] right-[-5%] w-[500px] h-[500px] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full flex justify-center">
        <main className="grow max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-32 pb-24 relative z-10 space-y-16">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-card/80 border border-border px-4 py-2.5 rounded-xl w-fit shadow-sm">
          <Link href="/" className="hover:text-[#fbbf24] transition-colors">Home</Link>
          <span className="opacity-50">/</span>
          <Link href="/products" className="hover:text-[#fbbf24] transition-colors">Shop Mangoes</Link>
          <span className="opacity-50">/</span>
          <span className="text-hero-text bg-[#fbbf24]/10 px-2 py-0.5 rounded text-[#fbbf24]">{product.name}</span>
        </div>

        {/* Product Details Section */}
        <div className="grid md:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Image Gallery */}
          <div className="md:col-span-6 space-y-4">
            <div className="relative h-[320px] sm:h-[450px] w-full rounded-3xl overflow-hidden glass-card p-4 border border-border/80 shadow-2xl group cursor-zoom-in" onClick={() => setIsZoomed(true)}>
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <Image
                  src={product.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              {badge && (
                <span className="absolute top-6 left-6 px-3 py-1.5 text-[10px] font-black text-black bg-[#fbbf24] rounded-full uppercase tracking-wider shadow-md">
                  {badge}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Content & Actions */}
          <div className="md:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-600 dark:text-[#34d399] uppercase tracking-wider bg-emerald-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Orchard Origin: {origin}
                </span>
                
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#fbbf24] text-[#fbbf24]" />
                  <span className="text-sm font-black text-hero-text">{avgRating}</span>
                  <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
                </div>
              </div>

              <h1 className="font-serif-heading text-3xl sm:text-4xl font-black text-hero-text leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Category:</span>
                <span className="text-xs font-bold text-hero-text bg-card border border-border px-2.5 py-1 rounded-md">
                  {product.category?.name || "Premium Grade"}
                </span>
              </div>
            </div>

            {/* Price section */}
            <div className="bg-card/40 backdrop-blur-md border border-border/80 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">Calculated Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#fbbf24]">৳&nbsp;{scaledPrice}</span>
                  <span className="text-xs text-muted-foreground font-semibold">for {selectedWeight}</span>
                </div>
              </div>

              <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                product.stock > 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-500"
              }`}>
                {product.stock > 0 ? "In Stock (Direct Harvest)" : "Harvest Blocked"}
              </span>
            </div>

            <p className="text-sm text-hero-text-secondary leading-relaxed">
              {product.description}
            </p>

            {/* Packaging / Weight Variant Selectors */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                Select Crate / Box Weight Option
              </label>
              <div className="grid grid-cols-4 gap-3">
                {["1kg", "2kg", "5kg", "10kg"].map((wt) => {
                  const isAvailable = weightOpts.includes(wt);
                  return (
                    <button
                      key={wt}
                      disabled={!isAvailable}
                      onClick={() => setSelectedWeight(wt)}
                      className={`py-3 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                        !isAvailable 
                          ? "opacity-30 cursor-not-allowed border-border"
                          : selectedWeight === wt
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-[#34d399] border-emerald-500/40 font-extrabold ring-4 ring-emerald-500/5"
                            : "bg-card border-border text-muted hover:text-hero-text hover:border-emerald-500/20"
                      }`}
                    >
                      {wt}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                * Note: Crate weights scale pricing proportionally (e.g. 5kg box is approx. 55% of the standard 10kg rate).
              </p>
            </div>

            {/* Quantity and Cart Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                {/* Quantity selector */}
                <div className="flex items-center bg-card border border-border rounded-xl">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="px-3.5 py-2.5 font-bold hover:text-[#fbbf24] transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 font-extrabold text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="px-3.5 py-2.5 font-bold hover:text-[#fbbf24] transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Wishlist Button for mobile */}
                <button
                  onClick={toggleWishlist}
                  className="sm:hidden p-3.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/20 transition-all cursor-pointer"
                >
                  <Heart className={`w-5 h-5 ${isWished ? "fill-red-500 text-red-500" : ""}`} />
                </button>
              </div>

              <div className="flex items-center gap-3 grow w-full">
                {/* Add to Crate */}
                <button
                  onClick={() => addToCart(product, quantity, selectedWeight)}
                  disabled={product.stock <= 0}
                  className="flex-1 py-3.5 bg-card hover:bg-muted-bg text-foreground font-extrabold rounded-xl shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs tracking-wider uppercase font-sans border border-border"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Add to Crate
                </button>

                {/* Buy Now */}
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs tracking-wider uppercase font-sans border border-[#fbbf24]/20"
                >
                  Buy Now
                </button>

                {/* Wishlist Button for desktop */}
                <button
                  onClick={toggleWishlist}
                  className="hidden sm:block p-3.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/20 transition-all cursor-pointer"
                >
                  <Heart className={`w-5 h-5 ${isWished ? "fill-red-500 text-red-500" : ""}`} />
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-3 pt-6 border-t border-border">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Share:</span>
              <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')} className="w-8 h-8 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center hover:bg-[#1877F2]/20 transition-colors cursor-pointer" aria-label="Share on Facebook">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </button>
              <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out ${product.name} on MangoDB!`)}`, '_blank')} className="w-8 h-8 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] flex items-center justify-center hover:bg-[#1DA1F2]/20 transition-colors cursor-pointer" aria-label="Share on Twitter">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </button>
              <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product.name} on MangoDB! ${window.location.href}`)}`, '_blank')} className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366]/20 transition-colors cursor-pointer" aria-label="Share on WhatsApp">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </button>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }} className="w-8 h-8 rounded-full bg-muted-bg border border-border text-muted-foreground flex items-center justify-center hover:bg-muted-bg/80 transition-colors cursor-pointer" aria-label="Copy Link">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              </button>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border text-center text-[10px] text-muted-foreground font-sans">
              <div className="p-3 bg-card/30 border border-border/60 rounded-xl space-y-1.5">
                <Truck className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                <p className="font-extrabold text-hero-text">Express Delivery</p>
                <p>24-48 Hours delivery</p>
              </div>
              <div className="p-3 bg-card/30 border border-border/60 rounded-xl space-y-1.5">
                <ShieldCheck className="w-4 h-4 mx-auto text-[#fbbf24]" />
                <p className="font-extrabold text-hero-text">100% Secure</p>
                <p>Cash on Delivery / Card</p>
              </div>
              <div className="p-3 bg-card/30 border border-border/60 rounded-xl space-y-1.5">
                <Award className="w-4 h-4 mx-auto text-pink-500" />
                <p className="font-extrabold text-hero-text">Pure Harvest</p>
                <p>No chemical additives</p>
              </div>
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <section className="border-t border-border pt-12 space-y-8">
          <h2 className="font-serif-heading text-2xl font-bold text-hero-text">
            Customer Reviews & Ratings
          </h2>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Review form */}
            <div className="md:col-span-4 bg-card/40 backdrop-blur-md border border-border/80 rounded-3xl p-6 space-y-6">
              <h3 className="font-bold text-hero-text text-base">Write a Review</h3>
              
              {profile ? (
                <form onSubmit={handleAddReview} className="space-y-4 font-sans">
                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-400 tracking-wider uppercase block">
                      Rating Star Count
                    </label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-[#fbbf24] hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-6 h-6 ${star <= rating ? "fill-current" : ""}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-400 tracking-wider uppercase block">
                      Your Comment
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this premium harvest..."
                      className="w-full bg-card border border-border rounded-xl p-3 text-xs font-semibold text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs tracking-wider uppercase"
                  >
                    {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Submit Review
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You must be signed in to rate products and share reviews.
                  </p>
                  <Link
                    href="/login"
                    className="inline-block px-5 py-2.5 rounded-xl bg-[#fbbf24] text-black font-extrabold text-xs hover:bg-[#f59e0b] shadow-sm transition-all"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* Review List */}
            <div className="md:col-span-8 space-y-6">
              {reviews.length === 0 ? (
                <div className="p-8 text-center bg-card/20 border border-border/60 rounded-3xl font-sans">
                  <p className="text-xs text-muted-foreground">
                    No reviews for this product yet. Be the first to review!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                  {reviews.map((rev) => (
                    <div 
                      key={rev.id} 
                      className="bg-card/40 backdrop-blur-md border border-border/60 rounded-2xl p-5 space-y-3 font-sans shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                            <User className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="text-xs font-extrabold text-hero-text">
                                {rev.profile?.full_name || "Premium customer"}
                              </h4>
                              <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                <ShieldCheck className="w-2.5 h-2.5" /> Verified Purchaser
                              </span>
                            </div>
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              {new Date(rev.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-3.5 h-3.5 text-[#fbbf24] ${star <= rev.rating ? "fill-current" : "opacity-30"}`} 
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-hero-text-secondary leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-border pt-12 space-y-6">
            <h2 className="font-serif-heading text-2xl font-bold text-hero-text">
              Related Varieties
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((prod) => {
                const origin = (prod.metadata as any)?.origin_district || "Rajshahi";
                return (
                  <div
                    key={prod.id}
                    className="group glass-card rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative h-44 w-full overflow-hidden shrink-0">
                      <Link href={`/products/${prod.slug}`} className="block w-full h-full cursor-pointer">
                        <Image
                          src={prod.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
                          alt={prod.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>
                    </div>
                    <div className="p-4 space-y-3">
                      <Link href={`/products/${prod.slug}`} className="block cursor-pointer group-hover:opacity-95">
                        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                          <span>{prod.category?.name || "Premium Grade"}</span>
                          <span>{origin}</span>
                        </div>
                        <h3 className="font-serif-heading font-bold text-hero-text text-sm group-hover:text-[#fbbf24] transition-colors truncate mt-1">
                          {prod.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-base font-black text-hero-text">৳&nbsp;{prod.sale_price || prod.price}</span>
                        <Link
                          href={`/products/${prod.slug}`}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>
      </div>

      {/* Image Zoom Lightbox */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
            onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden shadow-2xl animate-hero-scale-in">
            <Image
              src={product.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078"}
              alt={product.name}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
