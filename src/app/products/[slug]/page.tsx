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
    User
} from "lucide-react";
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
        
        {/* Back Link */}
        <Link 
          href="/products"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-[#fbbf24] transition-colors bg-card/80 border border-border px-4 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>

        {/* Product Details Section */}
        <div className="grid md:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Image Gallery */}
          <div className="md:col-span-6 space-y-4">
            <div className="relative h-[320px] sm:h-[450px] w-full rounded-3xl overflow-hidden glass-card p-4 border border-border/80 shadow-2xl">
              <img
                src={product.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
                alt={product.name}
                className="w-full h-full object-cover rounded-2xl"
              />
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
                  <span className="text-3xl font-black text-[#fbbf24]">৳{scaledPrice}</span>
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

            {/* Trust indicators */}
            <div className="grid grid-cols-3 gap-3 pt-6 text-center text-[10px] text-muted-foreground font-sans">
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
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                            <User className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-hero-text">
                              {rev.profile?.full_name || "Premium customer"}
                            </h4>
                            <p className="text-[9px] text-muted-foreground">
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
                        <img
                          src={prod.images?.[0]}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                        <span className="text-base font-black text-hero-text">৳{prod.sale_price || prod.price}</span>
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

      <Footer />
    </div>
  );
}
