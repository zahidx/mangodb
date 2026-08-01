"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import ImageZoom from "@/components/ImageZoom";
import Navbar from "@/components/Navbar";
import RecentlyViewed, { trackProductView } from "@/components/RecentlyViewed";
import { ProductDetailSkeleton } from "@/components/skeletons";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { createClient } from "@/lib/supabase/client";
import { getProductBySlug, getProductReviews, getProductVariants, getProducts } from "@/lib/supabase/queries";
import type { Product, ProductVariant, Review } from "@/types/database";
import {
    ArrowLeft,
    Award,
    Bell,
    Heart,
    ImagePlus,
    Loader2,
    Mail,
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
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector states — get available labels from variants or fall back to metadata
  const availableVariants = variants.length > 0 ? variants : [];
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [selectedWeight, setSelectedWeight] = useState<string>("10kg");
  const [quantity, setQuantity] = useState<number>(1);
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();
  const isWished = product ? isInWishlist(product.id) : false;

  // Stock notify state
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyingStock, setNotifyingStock] = useState(false);

  // Review form states
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewImageFiles, setReviewImageFiles] = useState<File[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number>(0);

  useEffect(() => {
    async function loadDetails() {
      if (!slug) return;
      setLoading(true);
      try {
        const prodRes = await getProductBySlug(slug);
        if (prodRes.data) {
          setProduct(prodRes.data);
          
          // Wishlist state is now managed by useWishlist hook

          // Fetch variants, reviews, and related products
          const [varRes, revRes, relRes] = await Promise.all([
            getProductVariants(prodRes.data.id),
            getProductReviews(prodRes.data.id),
            getProducts({ categorySlug: prodRes.data.category?.slug, limit: 4 })
          ]);

          if (varRes.data && varRes.data.length > 0) {
            setVariants(varRes.data);
            // Select first variant by default
            const first = varRes.data[0];
            setSelectedVariantId(first.id);
            setSelectedWeight(first.label);
          } else {
            // Fallback: use metadata weight options
            const weightOpts = (prodRes.data.metadata as any)?.weight_options;
            if (Array.isArray(weightOpts) && weightOpts.length > 0) {
              setSelectedWeight(weightOpts[0]);
            }
          }

          if (revRes.data) setReviews(revRes.data);
          if (relRes.data) {
            // Exclude current product from related
            setRelatedProducts(relRes.data.filter((p: any) => p.id !== prodRes.data.id));
          }

          // Track this product view
          trackProductView(prodRes.data);
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

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlist(product.id, product.name);
  };

  const filteredReviews = ratingFilter > 0
    ? reviews.filter((r: any) => r.rating === ratingFilter)
    : reviews;

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity, selectedWeight, false);
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
    
    // Upload review images first
    const uploadedImageUrls: string[] = [...reviewImages];
    for (const file of reviewImageFiles) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          uploadedImageUrls.push(uploadData.url);
        }
      } catch (err) {
        console.warn("Failed to upload review image", err);
      }
    }

    const newReviewData = {
      id: `rev-${Math.random()}`,
      user_id: profile.id,
      product_id: product.id,
      rating,
      comment: comment.trim(),
      images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
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

    // Submit review via API
    if (!profile.id.startsWith("demo-")) {
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: profile.id,
            product_id: product.id,
            rating,
            comment: comment.trim(),
            images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        // Use the server response for accurate data
        if (result.data) {
          newReviewData.id = result.data.id;
          newReviewData.created_at = result.data.created_at;
        }
      } catch (dbErr) {
        console.warn("Could not write review in DB, saving locally only");
      }
    }

    setReviews([newReviewData, ...reviews]);
    setComment("");
    setReviewImages([]);
    setReviewImageFiles([]);
    toast.success("Review submitted! It will appear after admin approval.");
    setSubmittingReview(false);
  };

  const handleReviewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.type.startsWith("image/")).slice(0, 5 - reviewImages.length - reviewImageFiles.length);
    setReviewImageFiles(prev => [...prev, ...validFiles]);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeReviewImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
    setReviewImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <Navbar />
        <ProductDetailSkeleton />
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

  // Get selected variant or compute price from multiplier (fallback)
  const selectedVariant = selectedVariantId ? variants.find(v => v.id === selectedVariantId) : null;
  const scaledPrice = selectedVariant
    ? (selectedVariant.sale_price || selectedVariant.price)
    : Math.round((product.sale_price || product.price) * (
      selectedWeight === "5kg" ? 0.55 : selectedWeight === "2kg" ? 0.25 : selectedWeight === "1kg" ? 0.13 : 1
    ));
  const variantStock = selectedVariant ? selectedVariant.stock : product.stock;
  const availableLabels = availableVariants.length > 0
    ? availableVariants.map(v => v.label)
    : ((product.metadata as any)?.weight_options || ["5kg", "10kg"]);
  
  const allImages = product.images?.length ? product.images : ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"];
  const origin = (product.metadata as any)?.origin_district || "Rajshahi";
  const badge = (product.metadata as any)?.badge;

  // Average Rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "4.8";

  // JSON-LD Structured Data for Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} — Premium quality sourced from ${origin}.`,
    image: product.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600",
    sku: product.id,
    mpn: product.id.slice(0, 8),
    brand: {
      "@type": "Brand",
      name: "MangoBite",
    },
    offers: {
      "@type": "Offer",
      url: typeof window !== "undefined" ? window.location.href : `/products/${product.slug}`,
      priceCurrency: "BDT",
      price: scaledPrice,
      priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      availability: variantStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetail",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "BDT" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "BD" },
      },
    },
    aggregateRating: reviews.length > 0 ? {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: reviews.length,
      bestRating: "5",
    } : undefined,
    review: reviews.slice(0, 5).map((r: any) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: "5",
      },
      author: {
        "@type": "Person",
        name: r.profile?.full_name || "Customer",
      },
    })),
    category: product.category?.name || "Premium Mangoes",
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-[#fbbf24] selection:text-black overflow-x-hidden">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd, (key, value) => value === undefined ? null : value) }}
      />
      <Navbar />

      {/* Background Orbs */}
      <div className="absolute top-[15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute top-[50%] right-[-5%] w-[500px] h-[500px] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full flex justify-center">
        <main className="grow max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-32 pb-24 relative z-10 space-y-16">
        
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Shop Mangoes", href: "/products" },
          { label: product.name },
        ]} />

        {/* Product Details Section */}
        <div className="grid md:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Image Gallery */}
          <div className="md:col-span-6 space-y-4">
            <div className="relative h-[320px] sm:h-[450px] w-full rounded-3xl overflow-hidden glass-card p-4 border border-border/80 shadow-2xl">
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <ImageZoom
                  src={allImages[activeImageIdx] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
                  alt={product.name}
                  className="w-full h-full"
                  zoom={2.5}
                  lensSize={140}
                />
              </div>
              {badge && (
                <span className="absolute top-6 left-6 px-3 py-1.5 text-[10px] font-black text-black bg-[#fbbf24] rounded-full uppercase tracking-wider shadow-md">
                  {badge}
                </span>
              )}
              {/* Image counter */}
              {allImages.length > 1 && (
                <span className="absolute bottom-6 right-6 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold">
                  {activeImageIdx + 1} / {allImages.length}
                </span>
              )}
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: "none" }}>
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      idx === activeImageIdx
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                        : "border-border/60 hover:border-emerald-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1553279768-865429fa0078?w=100&fit=crop"; }}
                    />
                  </button>
                ))}
              </div>
            )}
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
                variantStock > 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-500"
              }`}>
                {variantStock > 0 ? "In Stock (Direct Harvest)" : "Harvest Blocked"}
              </span>
            </div>

            {/* Notify Me When Available — shown when out of stock */}
            {variantStock <= 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                {!showNotifyForm ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-hero-text flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-500" />
                        Out of Stock
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This variety is currently harvest-blocked. Get notified when it&apos;s back!
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNotifyForm(true)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      Notify Me
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!notifyEmail.trim()) return;
                      setNotifyingStock(true);
                      try {
                        const res = await fetch("/api/stock-notify", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            product_id: product.id,
                            email: notifyEmail.trim(),
                            user_id: profile?.id || null,
                            product_name: product.name,
                          }),
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.error);
                        toast.success("You'll be notified when this variety is back in season!");
                        setShowNotifyForm(false);
                        setNotifyEmail("");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to submit request");
                      } finally {
                        setNotifyingStock(false);
                      }
                    }}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <div className="flex-1 relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        placeholder={profile?.email || "Your email address"}
                        className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-hero-text placeholder-muted-foreground focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={notifyingStock}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {notifyingStock ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                      {notifyingStock ? "Submitting..." : "Notify Me"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNotifyForm(false); setNotifyEmail(""); }}
                      className="px-3 py-2.5 text-xs font-bold text-muted-foreground hover:text-hero-text transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            )}

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
                {availableLabels.map((wt: string) => {
                  const variant = availableVariants.find(v => v.label === wt);
                  const vStock = variant ? variant.stock : 0;
                  const isAvailable = variant ? vStock > 0 : availableLabels.includes(wt);
                  const isSelected = selectedVariant ? selectedVariant.label === wt : selectedWeight === wt;
                  return (
                    <button
                      key={wt}
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedWeight(wt);
                        if (variant) setSelectedVariantId(variant.id);
                      }}
                      className={`py-3 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                        !isAvailable 
                          ? "opacity-30 cursor-not-allowed border-border"
                          : isSelected
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-[#34d399] border-emerald-500/40 font-extrabold ring-4 ring-emerald-500/5"
                            : "bg-card border-border text-muted hover:text-hero-text hover:border-emerald-500/20"
                      }`}
                    >
                      <span className="block">{wt}</span>
                      {variant && (
                        <span className="block text-[9px] opacity-70 mt-0.5 font-medium">
                          ৳{variant.sale_price || variant.price}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                * Each weight option has its own pricing and stock. Select to see the exact price.
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
                  onClick={handleToggleWishlist}
                  className="sm:hidden p-3.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/20 transition-all cursor-pointer"
                >
                  <Heart className={`w-5 h-5 ${isWished ? "fill-red-500 text-red-500" : ""}`} />
                </button>
              </div>

              <div className="flex items-center gap-3 grow w-full">
                {/* Add to Crate */}
                <button
                  onClick={() => addToCart(product, quantity, selectedWeight, true, selectedVariantId || undefined)}
                  disabled={variantStock <= 0}
                  className="flex-1 py-3.5 bg-card hover:bg-muted-bg text-foreground font-extrabold rounded-xl shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs tracking-wider uppercase font-sans border border-border"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Add to Crate
                </button>

                {/* Buy Now */}
                <button
                  onClick={handleBuyNow}
                  disabled={variantStock <= 0}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs tracking-wider uppercase font-sans border border-[#fbbf24]/20"
                >
                  Buy Now
                </button>

                {/* Wishlist Button for desktop */}
                <button
                  onClick={handleToggleWishlist}
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
              <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out ${product.name} on MangoBite!`)}`, '_blank')} className="w-8 h-8 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] flex items-center justify-center hover:bg-[#1DA1F2]/20 transition-colors cursor-pointer" aria-label="Share on Twitter">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </button>
              <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product.name} on MangoBite! ${window.location.href}`)}`, '_blank')} className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366]/20 transition-colors cursor-pointer" aria-label="Share on WhatsApp">
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

          {/* Average Rating Bar */}
          {reviews.length > 0 && (
            <div className="bg-card/30 border border-border/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="text-center sm:text-left shrink-0">
                <div className="text-4xl font-black text-hero-text">
                  {avgRating}
                </div>
                <div className="flex gap-0.5 mt-1 justify-center sm:justify-start">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 text-[#fbbf24] ${star <= Math.round(Number(avgRating)) ? "fill-current" : "opacity-30"}`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>

              {/* Rating distribution bars */}
              <div className="flex-1 space-y-1.5 w-full">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r: any) => r.rating === star).length;
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <button
                      key={star}
                      onClick={() => setRatingFilter(ratingFilter === star ? 0 : star)}
                      className={`flex items-center gap-2 w-full cursor-pointer group ${ratingFilter === star ? "opacity-100" : "opacity-70 hover:opacity-100"} transition-opacity`}
                    >
                      <span className="text-[11px] font-bold text-muted-foreground w-3 shrink-0">{star}</span>
                      <Star className="w-3 h-3 text-[#fbbf24] fill-[#fbbf24] shrink-0" />
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#fbbf24] rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium w-6 text-right shrink-0">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

                  {/* Review Photos */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-400 tracking-wider uppercase block">
                      Add Photos (optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[...reviewImages, ...reviewImageFiles.map(f => URL.createObjectURL(f))].map((url, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                          <img src={url} alt="Review" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeReviewImage(idx)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {(reviewImages.length + reviewImageFiles.length) < 5 && (
                        <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors bg-card/50">
                          <ImagePlus className="w-5 h-5 text-muted-foreground" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleReviewImageSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Upload up to 5 images (JPEG, PNG). Max 5MB each.</p>
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
            <div className="md:col-span-8 space-y-4">
              {/* Rating filter chips */}
              {reviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "All", value: 0 },
                    { label: "5★", value: 5 },
                    { label: "4★", value: 4 },
                    { label: "3★", value: 3 },
                    { label: "2★", value: 2 },
                    { label: "1★", value: 1 },
                  ].map((opt) => {
                    const count = opt.value === 0 ? reviews.length : reviews.filter((r: any) => r.rating === opt.value).length;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setRatingFilter(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          ratingFilter === opt.value
                            ? "bg-[#fbbf24] text-black border-[#fbbf24]"
                            : "bg-card border-border text-muted-foreground hover:border-[#fbbf24]/50"
                        }`}
                      >
                        {opt.label} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredReviews.length === 0 ? (
                <div className="p-8 text-center bg-card/20 border border-border/60 rounded-3xl font-sans">
                  <p className="text-xs text-muted-foreground">
                    {ratingFilter > 0 ? "No reviews with this rating yet." : "No reviews for this product yet. Be the first to review!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                  {filteredReviews.map((rev: any) => (
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
                              {rev.is_verified_purchase && (
                                <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Verified
                                </span>
                              )}
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

                      {/* Review Photos */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {rev.images.map((imgUrl: string, imgIdx: number) => (
                            <a
                              key={imgIdx}
                              href={imgUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-16 h-16 rounded-lg overflow-hidden border border-border/60 hover:ring-2 hover:ring-emerald-400/50 transition-all"
                            >
                              <img
                                src={imgUrl}
                                alt={`Review photo ${imgIdx + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related Products — Horizontal Scroll */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-border pt-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif-heading text-2xl font-bold text-hero-text">
                Related Varieties
              </h2>
              <Link
                href={product?.category ? `/products?category=${product.category.slug}` : "/products"}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                View All
                <span className="text-lg leading-none">→</span>
              </Link>
            </div>
            <div className="relative group/scroll">
              {relatedProducts.length > 3 && (
                <>
                  <button
                    onClick={() => {
                      const el = document.getElementById("related-scroll");
                      if (el) el.scrollBy({ left: -320, behavior: "smooth" });
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer opacity-0 group-hover/scroll:opacity-100"
                    aria-label="Scroll left"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById("related-scroll");
                      if (el) el.scrollBy({ left: 320, behavior: "smooth" });
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer opacity-0 group-hover/scroll:opacity-100"
                    aria-label="Scroll right"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              <div
                id="related-scroll"
                className="flex gap-5 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {relatedProducts.map((prod) => {
                  const origin = (prod.metadata as any)?.origin_district || "Rajshahi";
                  return (
                    <div
                      key={prod.id}
                      className="snap-start shrink-0 w-[260px] group bg-white rounded-xl overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-gray-100"
                    >
                      <div className="relative h-40 w-full overflow-hidden shrink-0 bg-gray-50">
                        <Link href={`/products/${prod.slug}`} className="block w-full h-full">
                          <Image
                            src={prod.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
                            alt={prod.name}
                            fill
                            sizes="260px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </Link>
                      </div>
                      <div className="p-3.5 space-y-2.5">
                        <Link href={`/products/${prod.slug}`} className="block group-hover:opacity-95">
                          <div className="flex items-center justify-between text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                            <span>{prod.category?.name || "Premium"}</span>
                            <span>{origin}</span>
                          </div>
                          <h3 className="font-bold text-gray-800 text-sm group-hover:text-emerald-700 transition-colors truncate mt-1">
                            {prod.name}
                          </h3>
                        </Link>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-base font-black text-gray-800">
                            ৳&nbsp;{(prod.sale_price || prod.price).toLocaleString("en-BD")}
                          </span>
                          <Link
                            href={`/products/${prod.slug}`}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold transition-all"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
          {/* Gallery nav in lightbox */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImageIdx(prev => prev > 0 ? prev - 1 : allImages.length - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors z-10"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImageIdx(prev => prev < allImages.length - 1 ? prev + 1 : 0); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-bold">
                {activeImageIdx + 1} / {allImages.length}
              </span>
            </>
          )}
          <div className="relative w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden shadow-2xl animate-hero-scale-in">
            <Image
              src={allImages[activeImageIdx] || product.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078"}
              alt={product.name}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}

      <Footer />

      {/* ===== STICKY ADD-TO-CART BAR (Mobile only) ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden safe-area-bottom">
        <div className="flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{product?.name}</p>
            <p className="text-sm font-black text-emerald-600">৳{scaledPrice}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Quantity selector */}
            <div className="flex items-center bg-gray-100 rounded-lg">
              <button
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="px-3 py-2 font-bold text-gray-600 hover:text-gray-900 text-sm cursor-pointer"
              >
                −
              </button>
              <span className="px-2 font-extrabold text-sm text-gray-900 min-w-[20px] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(prev => prev + 1)}
                className="px-3 py-2 font-bold text-gray-600 hover:text-gray-900 text-sm cursor-pointer"
              >
                +
              </button>
            </div>
            <button
              onClick={() => product && addToCart(product, quantity, selectedWeight, true, selectedVariantId || undefined)}
              disabled={variantStock <= 0}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <ShoppingBag className="w-4 h-4" />
              {variantStock > 0 ? "Add" : "Sold Out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
