"use client";

import BannerCarousel from "@/components/BannerCarousel";
import FeaturedProducts from "@/components/FeaturedProducts";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PromoBanners from "@/components/PromoBanners";
import QuickViewModal from "@/components/QuickViewModal";
import { ProductGridSkeleton } from "@/components/skeletons";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCompare } from "@/context/CompareContext";
import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";
import { createClient } from "@/lib/supabase/client";
import { getCategories } from "@/lib/supabase/queries";
import {
    ArrowRight,
    Award,
    Check,
    Coins,
    CreditCard,
    Heart,
    Leaf,
    Loader2,
    Package,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Star,
    Truck,
    X,
    Zap
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function HomePage() {
  const router = useRouter();
  const { profile: user, isAdmin, loading } = useAuth();
  const { addToCart } = useCart();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const supabase = createClient() as any;

  // New States for competitor features (Express Checkout, Order Tracking, Video Player)
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingIdInput, setTrackingIdInput] = useState("");
  const [searchedTrackingId, setSearchedTrackingId] = useState<string | null>(null);
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<any | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<5 | 10>(10);
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "cod"
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  // Fly-to-cart animation state
  const [flyingItems, setFlyingItems] = useState<{ id: string, startX: number, startY: number, targetX: number, targetY: number, img: string }[]>([]);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>, prod: any) => {
    e.preventDefault();
    addToCart(prod, 1, "10kg");
    
    const buttonRect = e.currentTarget.getBoundingClientRect();
    const cartEl = document.querySelector('a[aria-label="View Cart"]');
    let targetX = window.innerWidth - 60;
    let targetY = 20;

    if (cartEl) {
      const cartRect = cartEl.getBoundingClientRect();
      targetX = cartRect.left + cartRect.width / 2 - 20;
      targetY = cartRect.top + cartRect.height / 2 - 20;
    }

    const id = Date.now().toString();
    const newFly = {
      id,
      startX: buttonRect.left + buttonRect.width / 2 - 20,
      startY: buttonRect.top,
      targetX,
      targetY,
      img: prod.images?.[0] || "/products/mango.png"
    };

    setFlyingItems(prev => [...prev, newFly]);

    setTimeout(() => {
      setFlyingItems(prev => prev.filter(item => item.id !== id));
    }, 800);
  };
  
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const savedWish = localStorage.getItem("mangobite-wishlist");
    if (savedWish) {
      try {
        setWishlist(JSON.parse(savedWish));
      } catch (e) {}
    }
  }, []);

  const toggleWishlist = (productId: string) => {
    let nextWish = [...wishlist];
    if (wishlist.includes(productId)) {
      nextWish = nextWish.filter(id => id !== productId);
      toast.success("Removed from wishlist");
    } else {
      nextWish.push(productId);
      toast.success("Added to wishlist");
    }
    setWishlist(nextWish);
    localStorage.setItem("mangobite-wishlist", JSON.stringify(nextWish));
  };

  // Prefill shipping info if user is logged in
  useEffect(() => {
    if (user) {
      setCheckoutForm(prev => ({
        ...prev,
        name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || ""
      }));
    }
  }, [user]);

  // Check URL params for track=true
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("track") === "true") {
        setIsTrackingOpen(true);
        const orderId = params.get("id");
        if (orderId) {
          setTrackingIdInput(orderId);
          setSearchedTrackingId(orderId);
        }
        // Clean up URL parameters
        window.history.replaceState({}, "", "/");
      }
    }
  }, []);

  // Live-updating mock orders mapping
  const [ordersMap, setOrdersMap] = useState<Record<string, any>>({
    "MNG-8842": {
      status: "packed",
      date: "Today, 10:30 AM",
      details: "Your crate of Rajshahi Himsagar is packed and ready for shipment.",
      productName: "Rajshahi Himsagar",
      weight: "10kg Crate"
    },
    "MNG-7731": {
      status: "delivered",
      date: "Yesterday, 4:15 PM",
      details: "Delivered to Dhanmondi, Dhaka. Signed by recipient.",
      productName: "Premium Amrapali",
      weight: "5kg Box"
    },
    "MNG-9910": {
      status: "orchard",
      date: "Today, 6:00 AM",
      details: "Selected from our partner orchard in Kansat, Rajshahi.",
      productName: "Chapainawabganj Lengra",
      weight: "10kg Crate"
    }
  });

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOrder(true);
    
    const newOrderId = `MNG-${Math.floor(100000 + Math.random() * 900000)}`;
    const price = checkoutProduct.sale_price || checkoutProduct.price;
    const multiplier = selectedWeight === 10 ? 1 : 0.55;
    const subtotal = Math.round(price * multiplier);
    const delivery = checkoutForm.address.toLowerCase().includes("dhaka") ? 120 : 200;
    const total = subtotal + delivery;

    const orderData = {
      id: newOrderId,
      status: "pending",
      subtotal,
      tax: 0,
      total,
      shipping_address: {
        full_name: checkoutForm.name,
        address_line_1: checkoutForm.address,
        city: checkoutForm.address.toLowerCase().includes("dhaka") ? "Dhaka" : "Outside Dhaka",
        state: "BD",
        postal_code: "1000",
        country: "Bangladesh",
        phone: checkoutForm.phone,
      },
      payment_status: "pending",
      payment_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order_items: [
        {
          id: `item-${Math.random()}`,
          product_id: checkoutProduct.id,
          quantity: 1,
          unit_price: subtotal,
          total_price: subtotal,
          product: checkoutProduct
        }
      ]
    };

    // If logged in via Supabase, write to database
    if (user && !user.id?.startsWith("demo-")) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            status: "pending",
            subtotal,
            tax: 0,
            total,
            shipping_address: orderData.shipping_address,
            payment_status: "pending",
          })
          .select()
          .single();

        if (!error && data) {
          await supabase.from("order_items").insert({
            order_id: data.id,
            product_id: checkoutProduct.id,
            quantity: 1,
            unit_price: subtotal,
            total_price: subtotal,
          });
        }
      } catch (dbErr) {
        console.warn("Could not insert order in DB, falling back to local storage");
      }
    }

    // Save to local storage
    const existingOrders = JSON.parse(localStorage.getItem("mangobite-orders") || "[]");
    localStorage.setItem("mangobite-orders", JSON.stringify([orderData, ...existingOrders]));

    // Update the live ordersMap in page state so order tracking works instantly!
    setOrdersMap(prev => ({
      ...prev,
      [newOrderId]: {
        status: "orchard",
        date: "Just now",
        details: `Freshly ordered! Handpicking your ${selectedWeight}kg of premium ${checkoutProduct.name} from the orchard.`,
        productName: checkoutProduct.name,
        weight: `${selectedWeight}kg ${selectedWeight === 10 ? 'Crate' : 'Box'}`
      }
    }));

    // Trigger transactional email
    if (checkoutForm.email) {
      try {
        await fetch("/api/send-order-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: newOrderId,
            customerName: checkoutForm.name,
            email: checkoutForm.email,
            phone: checkoutForm.phone,
            total,
            productName: `${checkoutProduct.name} (${selectedWeight}kg)`,
            shippingAddress: checkoutForm.address,
            paymentMethod: checkoutForm.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment",
          }),
        });
      } catch (err) {
        console.error("Failed to send order email:", err);
      }
    }

    setIsSubmittingOrder(false);
    setOrderSuccessId(newOrderId);
  };

  const handleTrackingSearch = () => {
    if (!trackingIdInput.trim()) return;
    const queryId = trackingIdInput.trim().toUpperCase();
    
    // Check if in ordersMap state
    if (ordersMap[queryId]) {
      setSearchedTrackingId(queryId);
      return;
    }

    // Check if in localStorage
    const stored = JSON.parse(localStorage.getItem("mangobite-orders") || "[]");
    const matched = stored.find((o: any) => o.id === queryId);
    if (matched) {
      const statusMap: Record<string, string> = {
        "pending": "orchard",
        "confirmed": "quality",
        "processing": "packed",
        "shipped": "shipping",
        "delivered": "delivered",
        "cancelled": "cancelled"
      };

      setOrdersMap(prev => ({
        ...prev,
        [queryId]: {
          status: statusMap[matched.status] || "orchard",
          date: new Date(matched.created_at).toLocaleDateString(),
          details: `Order status: ${matched.status}. Shipping to: ${matched.shipping_address?.address_line_1}`,
          productName: matched.order_items?.[0]?.product?.name || "Premium Mango Variety",
          weight: matched.order_items?.[0]?.product?.metadata?.weight_options?.[0] || "10kg"
        }
      }));
      setSearchedTrackingId(queryId);
      return;
    }

    toast.error("Order Crate ID not found");
    setSearchedTrackingId(null);
  };

  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);

  // Infinite scroll for the "All Products" grid
  const {
    products: allProducts,
    loading: allLoading,
    loadingMore: allLoadingMore,
    hasMore: allHasMore,
    error: allProductsError,
    sentinelRef: allSentinelRef,
  } = useInfiniteProducts({
    categorySlug: activeCategory === "all" ? undefined : activeCategory,
    sortBy: "newest",
    pageSize: 12,
    resetKey: `homepage-${activeCategory}`,
  });

  // Fetch categories once on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const catRes = await getCategories();
        if (catRes.data) {
          setDynamicCategories(catRes.data);
        }
      } catch (err) {}
    }
    loadCategories();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-200 relative flex flex-col transition-colors duration-200">
      <Navbar />

      {/* ====== MAIN CONTENT WRAPPER ====== */}
      <main className="grow flex flex-col relative z-10 pt-16">
        {/* 1. Dynamic Hero Banner Carousel */}
        <BannerCarousel />

        {/* 2. Promo & Curated Seasonal Bento Banners */}
        <PromoBanners />

        {/* 3. Featured Products Collection */}
        <FeaturedProducts />

        {/* 4. Category Navigation Tabs */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 w-full relative z-20">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">
                Explore The Orchard
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-hero-text mt-0.5">
                Browse by Category
              </h2>
            </div>
            <Link
              href="/categories"
              className="text-xs font-semibold text-hero-text hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>All Categories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div
            className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 w-full scrollbar-hide"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
          >
            {/* All Products Tab */}
            <button
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 border cursor-pointer ${
                activeCategory === "all"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-card text-hero-text border-border hover:border-border-strong hover:bg-muted-bg"
              }`}
            >
              <div className="w-8 h-8 rounded-xl overflow-hidden relative bg-emerald-50 shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=120&auto=format&fit=crop&q=80"
                  alt="All Products"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <span className="text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap">
                All Products
              </span>
            </button>

            {/* Dynamic Category Tabs */}
            {dynamicCategories.map((cat, i) => {
              const getCategoryFallbackImage = (slug: string) => {
                switch (slug) {
                  case "mango":
                    return "https://images.unsplash.com/photo-1553279768-865429fa0078?w=120&auto=format&fit=crop&q=80";
                  case "dates":
                    return "https://images.unsplash.com/photo-1528659138676-e91851e18dc9?w=120&auto=format&fit=crop&q=80";
                  case "ghee":
                    return "https://images.unsplash.com/photo-1589134712613-207d571f28b5?w=120&auto=format&fit=crop&q=80";
                  case "honey":
                    return "https://images.unsplash.com/photo-1587049352847-4d4b1f41b2a2?w=120&auto=format&fit=crop&q=80";
                  case "nuts":
                    return "https://images.unsplash.com/photo-1599598425947-33002621743a?w=120&auto=format&fit=crop&q=80";
                  case "cold-drinks":
                    return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120&auto=format&fit=crop&q=80";
                  case "combo-package":
                    return "https://images.unsplash.com/photo-1598144073024-db080e7bbfa8?w=120&auto=format&fit=crop&q=80";
                  case "pickle":
                    return "https://images.unsplash.com/photo-1627042633145-b780d842ba45?w=120&auto=format&fit=crop&q=80";
                  default:
                    return "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=120&auto=format&fit=crop&q=80";
                }
              };
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id || i}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-card text-hero-text border-border hover:border-border-strong hover:bg-muted-bg"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl overflow-hidden relative bg-emerald-50 shrink-0">
                    <Image
                      src={cat.image_url || getCategoryFallbackImage(cat.slug)}
                      alt={cat.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. All Products Grid (Retail format like products page) */}
        <section className="py-14 sm:py-18 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-border gap-2">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">
                Available Harvest
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-hero-text mt-0.5">
                Our Premium Catalog
              </h2>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Showing {allProducts.length} verified harvest varieties
            </p>
          </div>

          {/* Error State */}
          {allProductsError && !allLoading && (
            <div className="py-16 text-center bg-card rounded-3xl border border-border p-8 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="font-bold text-hero-text text-base">Could not load catalog</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {allProductsError?.includes("relation") || allProductsError?.includes("exist")
                  ? "Database setup in progress. Please retry in a moment."
                  : allProductsError}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Reload Catalog
              </button>
            </div>
          )}

          {/* Initial Loading */}
          {allLoading && allProducts.length === 0 && !allProductsError && (
            <ProductGridSkeleton count={10} />
          )}

          {/* Empty State */}
          {!allLoading && allProducts.length === 0 && !allProductsError && (
            <div className="py-20 text-center bg-card rounded-3xl border border-border p-8">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-hero-text text-sm">No products found in this category</h3>
              <p className="text-xs text-muted-foreground mt-1">Please select another category or view all items.</p>
              <button
                onClick={() => setActiveCategory("all")}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                View All Categories
              </button>
            </div>
          )}

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {allProducts.map((prod) => (
              <div
                key={prod.id}
                className="group bg-card rounded-2xl border border-border hover:border-emerald-500/30 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300"
              >
                {/* Image Container */}
                <div className="relative h-44 sm:h-52 w-full overflow-hidden shrink-0 bg-muted-bg">
                  <Link href={`/products/${prod.slug}`} className="block w-full h-full">
                    <Image
                      src={
                        prod.images?.[0] ||
                        "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"
                      }
                      alt={prod.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Delivery / Badge */}
                    <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-semibold text-emerald-950 dark:text-emerald-100 bg-emerald-400/90 dark:bg-emerald-600/90 backdrop-blur-md rounded-full shadow-sm z-10">
                      <Truck className="w-2.5 h-2.5" />
                      <span>48h Fast</span>
                    </span>

                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setQuickViewProduct(prod);
                        }}
                        className="px-3.5 py-1.5 bg-white text-neutral-900 font-semibold text-xs rounded-lg shadow-md hover:bg-neutral-100 transition-all cursor-pointer active:scale-95"
                      >
                        Quick View
                      </button>
                    </div>
                  </Link>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(prod.id);
                    }}
                    className="absolute top-2.5 left-2.5 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 transition-all z-20 cursor-pointer active:scale-90"
                    aria-label="Wishlist"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
                        wishlist.includes(prod.id) ? "fill-rose-500 text-rose-500" : ""
                      }`}
                    />
                  </button>

                  {/* Compare Checkbox */}
                  <label className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-white/15 text-white cursor-pointer hover:bg-black/70 transition-colors text-[9px] font-mono">
                    <input
                      type="checkbox"
                      checked={isInCompare(prod.id)}
                      onChange={(e) => {
                        if (e.target.checked) addToCompare(prod);
                        else removeFromCompare(prod.id);
                      }}
                      className="w-2.5 h-2.5 rounded border-white/40 text-emerald-500 focus:ring-0 bg-transparent"
                    />
                    <span className="hidden sm:inline">Compare</span>
                  </label>
                </div>

                {/* Content */}
                <div className="p-3.5 sm:p-4 flex flex-col grow justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <Link href={`/products/${prod.slug}`} className="block group-hover:opacity-90">
                      <h3 className="font-bold text-hero-text text-xs sm:text-sm leading-snug line-clamp-2">
                        {prod.name}
                      </h3>
                    </Link>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 font-normal">
                      5/10kg Packages · Rajshahi Harvest
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50 space-y-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm sm:text-base font-extrabold text-hero-text">
                        ৳{prod.sale_price || prod.price}
                      </span>
                      {prod.sale_price && prod.sale_price < prod.price && (
                        <span className="text-[11px] text-muted-foreground line-through">
                          ৳{prod.price}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground font-mono ml-auto">/ 10kg</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(prod, 1, "10kg", false);
                          router.push("/checkout");
                        }}
                        className="flex items-center justify-center gap-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer active:scale-95 text-[11px] font-semibold shadow-xs"
                        title="Instant Checkout"
                      >
                        <Zap className="w-3 h-3 fill-white" />
                        <span>Buy</span>
                      </button>
                      <button
                        onClick={(e) => handleAddToCart(e, prod)}
                        className="flex items-center justify-center gap-1 py-2 border border-border bg-card hover:bg-muted-bg text-hero-text rounded-xl transition-all cursor-pointer active:scale-95 text-[11px] font-semibold"
                        title="Add to Basket"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading More Spinner */}
          {allLoadingMore && (
            <div className="flex items-center justify-center gap-2 mt-12 py-4">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              <span className="text-xs font-medium text-muted-foreground font-mono">
                Fetching more harvest varieties...
              </span>
            </div>
          )}

          {/* End of results */}
          {!allHasMore && allProducts.length > 0 && (
            <div className="text-center mt-12 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground font-mono">
                You have reached the end of this season's catalog · 🥭
              </p>
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={allSentinelRef} className="h-4" />
        </section>

        {/* 6. Why MangoBite — Farm to Door Editorial Bento Grid */}
        <section className="py-20 bg-section-alt border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">
                Our Guarantee
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-hero-text mt-1">
                Why MangoBite is Different
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Direct orchard contracts, safe chemical-free farming, and swift cold-chain transport eliminate the middlemen and preserve the fruit's authentic honeyed flavor.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {/* Bento 1: Large Featured Card */}
              <div className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm min-h-[360px] flex flex-col justify-end p-6 sm:p-8 group">
                <Image
                  src="/mango_garden_safe.jpg"
                  alt="Registered Safe Orchard"
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover absolute inset-0 z-0 transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />
                <div className="relative z-20 text-white max-w-lg">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-[10px] font-mono uppercase tracking-wider mb-4">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Safe Farming Standard
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug mb-2.5">
                    Contracted Safe Orchards
                  </h3>
                  <p className="text-sm text-white/80 leading-relaxed font-normal">
                    We partner directly with certified family gardens in Kansat and Shibganj. Every tree is strictly monitored to eliminate calcium carbide and synthetic ripening sprays.
                  </p>
                </div>
              </div>

              {/* Bento 2: Zero Chemical Guarantee */}
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    100% Purity
                  </span>
                  <h3 className="text-xl font-bold text-hero-text tracking-tight mt-1 mb-2">
                    Zero Formalin & Carbide
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Naturally tree-ripened under direct sunlight. Each batch passes our quality sweetness and aroma inspection prior to packing.
                  </p>
                </div>
              </div>

              {/* Bento 3: 48-Hour Cold Chain */}
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Direct Logistics
                  </span>
                  <h3 className="text-xl font-bold text-hero-text tracking-tight mt-1 mb-2">
                    48-Hour Farm-to-Door
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Harvested in the morning, sorted by afternoon, and dispatched directly to your doorstep in Dhaka and nationwide.
                  </p>
                </div>
              </div>

              {/* Bento 4: Eco Packaging */}
              <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-emerald-500/30 hover:shadow-md transition-all duration-300">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Fruit Protection
                  </span>
                  <h3 className="text-xl font-bold text-hero-text tracking-tight">
                    Eco-Ventilated Cushion Crates
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
                    Custom-built wooden crates with soft breathable cushioning prevent bruising, moisture accumulation, and heat damage during transit.
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    onClick={() => setIsTrackingOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border hover:border-border-strong text-hero-text font-semibold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    <span>Track Your Crate Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Curated Seasonal Gifting Section */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="rounded-3xl border border-border bg-card overflow-hidden grid md:grid-cols-2 items-center">
            <div className="p-6 sm:p-10 md:p-12 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono uppercase tracking-widest border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Corporate & Family Gifting
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-hero-text leading-tight">
                Gift A Crate of Pure Rajshahi Sunshine
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                Make summer memorable for clients, colleagues, and loved ones. Our premium gift boxes feature top-tier hand-selected Himsagar and Langra with bespoke greeting notes.
              </p>

              <div className="pt-2">
                <Link
                  href="/products?category=combo-package"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <span>Order Seasonal Gift Box</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="relative h-72 sm:h-96 md:h-full min-h-[320px] w-full bg-muted-bg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=1000&auto=format&fit=crop&q=80"
                alt="Mango Gift Hamper"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* 8. Our Story — Contracted Gardens (#farm) */}
        <section
          id="farm"
          className="py-24 bg-neutral-950 text-white border-y border-neutral-800/60 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            {/* Header */}
            <div className="max-w-2xl mx-auto text-center mb-16">
              <span className="inline-block px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-[10px] font-mono uppercase tracking-widest mb-3">
                Heritage & Traceability
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                Where Every Mango Tells a Heritage Story
              </h2>
              <p className="text-sm sm:text-base text-white/70 mt-4 leading-relaxed font-normal">
                We partner directly with 50+ generational family orchards across Rajshahi and Chapainawabganj — bringing you fruits that are 100% formalin-free and hand-inspected with pride.
              </p>
            </div>

            {/* Stats Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-16">
              {[
                { number: "50+", label: "Partner Orchards", sub: "Kansat, Shibganj, Bagha" },
                { number: "12+", label: "Native Cultivars", sub: "Himsagar, Lengra, Amrapali" },
                { number: "10K+", label: "Happy Customers", sub: "Dhaka, CTG & Nationwide" },
                { number: "48hr", label: "Farm-to-Door", sub: "Direct Cold-Chain" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors"
                >
                  <div className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {stat.number}
                  </div>
                  <div className="text-xs font-semibold text-white/90 mt-1">{stat.label}</div>
                  <div className="text-[10px] text-white/50 font-mono mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Story Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Certified Safe Orchards",
                  desc: "Every orchard in our network is audited for chemical-free farming. No formalin, no calcium carbide — just sun-ripened fruit.",
                  image: "https://images.unsplash.com/photo-1550828520-4cb496926fc9?w=600&auto=format&fit=crop&q=80",
                  tag: "Certified Non-Toxic",
                },
                {
                  title: "Direct Farmer Partnerships",
                  desc: "We work hand-in-hand with generational growers, ensuring fair compensation and sustainable agriculture across the northern belt.",
                  image: "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=600&auto=format&fit=crop&q=80",
                  tag: "Fair Trade",
                },
                {
                  title: "Quality Control Lab Inspection",
                  desc: "Each fruit is hand-graded for brix sweetness, firmness, and skin integrity before being nested in breathable pine crates.",
                  image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80",
                  tag: "Hand Inspected",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/25 transition-all flex flex-col"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-neutral-900">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[9px] font-mono font-medium uppercase tracking-wider">
                        {card.tag}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col grow justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight mb-2">
                        {card.title}
                      </h3>
                      <p className="text-xs text-white/70 leading-relaxed font-normal">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-14 text-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-neutral-950 font-semibold rounded-xl hover:bg-neutral-100 transition-all text-xs sm:text-sm active:scale-98 cursor-pointer shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explore The Season's Harvest</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 9. Customer Feedback & Testimonials */}
        <section className="py-20 bg-background border-b border-border overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-border">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">
                  Customer Reviews
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-hero-text mt-0.5">
                  Loved Across Bangladesh
                </h2>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Verified reviews from verified crate deliveries
              </p>
            </div>
          </div>

          <div className="relative w-full overflow-hidden select-none">
            <div className="animate-marquee hover:[animation-play-state:paused] flex gap-5 px-4">
              {[
                {
                  name: "Tahmid Hasan",
                  location: "Gulshan, Dhaka",
                  rating: 5,
                  comment:
                    "Unmatched sweetness and flawless aroma. The Rajshahi Himsagar was naturally ripe and fiberless. Ordering again for my family next week!",
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
                },
                {
                  name: "Nusrat Jahan",
                  location: "Dhanmondi, Dhaka",
                  rating: 5,
                  comment:
                    "I was skeptical about buying mangoes online due to chemical fears, but MangoBite's safe orchard promise was 100% true. Fresh and authentic.",
                  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
                },
                {
                  name: "Sajid Rahman",
                  location: "Chittagong",
                  rating: 5,
                  comment:
                    "The eco-ventilated crate arrived in perfect condition. Every single mango was cushioned and undamaged. Fast delivery within 48 hours.",
                  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
                },
                {
                  name: "Farhana Yasmin",
                  location: "Uttara, Dhaka",
                  rating: 5,
                  comment:
                    "Best Langra mangoes I have had in years. Sweet, juicy, and impeccably packed. Highly recommended for authentic northern harvest.",
                  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
                },
              ]
                .concat([
                  {
                    name: "Tahmid Hasan",
                    location: "Gulshan, Dhaka",
                    rating: 5,
                    comment:
                      "Unmatched sweetness and flawless aroma. The Rajshahi Himsagar was naturally ripe and fiberless. Ordering again for my family next week!",
                    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
                  },
                  {
                    name: "Nusrat Jahan",
                    location: "Dhanmondi, Dhaka",
                    rating: 5,
                    comment:
                      "I was skeptical about buying mangoes online due to chemical fears, but MangoBite's safe orchard promise was 100% true. Fresh and authentic.",
                    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
                  },
                  {
                    name: "Sajid Rahman",
                    location: "Chittagong",
                    rating: 5,
                    comment:
                      "The eco-ventilated crate arrived in perfect condition. Every single mango was cushioned and undamaged. Fast delivery within 48 hours.",
                    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
                  },
                  {
                    name: "Farhana Yasmin",
                    location: "Uttara, Dhaka",
                    rating: 5,
                    comment:
                      "Best Langra mangoes I have had in years. Sweet, juicy, and impeccably packed. Highly recommended for authentic northern harvest.",
                    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
                  },
                ])
                .map((review, i) => (
                  <div
                    key={i}
                    className="bg-card p-6 sm:p-7 rounded-2xl border border-border hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between w-[300px] sm:w-[360px] shrink-0 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1 text-amber-500 mb-3">
                        {[...Array(review.rating)].map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-amber-500" />
                        ))}
                      </div>
                      <p className="text-hero-text text-xs sm:text-sm leading-relaxed italic mb-5 font-normal">
                        "{review.comment}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-border/60">
                      <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-muted-bg">
                        <Image src={review.avatar} alt={review.name} fill className="object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-hero-text text-xs">{review.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {review.location} · Verified Buyer
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* ====== EXPRESS CHECKOUT DRAWER ====== */}
      {isCheckoutOpen && checkoutProduct && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCheckoutOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col h-full z-10 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-section-alt">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-hero-text">Express Checkout</h3>
                <p className="text-xs text-muted-foreground">Complete your order in 30 seconds</p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-hero-text transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {orderSuccessId ? (
                <div className="text-center py-8 space-y-5">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                    <Check className="w-7 h-7 stroke-[3]" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-xl font-bold text-hero-text">Order Confirmed!</h4>
                    <p className="text-xs text-muted-foreground">Thank you for ordering with MangoBite.</p>
                  </div>
                  <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 inline-block w-full">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                      Your Order Reference
                    </p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-wider mt-1 font-mono">
                      {orderSuccessId}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Track your crate live from harvest to delivery!
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        setTrackingIdInput(orderSuccessId);
                        setSearchedTrackingId(orderSuccessId);
                        setIsTrackingOpen(true);
                      }}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Track Order Live
                    </button>
                    <button
                      onClick={() => setIsCheckoutOpen(false)}
                      className="flex-1 py-3 bg-card border border-border hover:bg-muted-bg text-hero-text font-semibold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                  {/* Product Thumbnail */}
                  <div className="p-3.5 rounded-2xl bg-section-alt border border-border flex items-center gap-3.5">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border bg-muted-bg">
                      <Image
                        src={checkoutProduct.images?.[0] || "/products/mango.png"}
                        alt={checkoutProduct.name || "Product"}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {(checkoutProduct.metadata as any)?.badge || "Certified Harvest"}
                      </span>
                      <h4 className="font-bold text-hero-text text-sm leading-tight">
                        {checkoutProduct.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">Formalin & Carbide Free</p>
                    </div>
                  </div>

                  {/* Weight Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-hero-text block font-semibold">
                      Select Package Size
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedWeight(5)}
                        className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedWeight === 5
                            ? "border-emerald-600 bg-emerald-500/10 text-hero-text font-bold"
                            : "border-border bg-card text-muted-foreground hover:border-border-strong"
                        }`}
                      >
                        <span className="block text-sm font-bold">5kg Box</span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5 font-mono">
                          ৳{Math.round((checkoutProduct.sale_price || checkoutProduct.price) * 0.55)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedWeight(10)}
                        className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedWeight === 10
                            ? "border-emerald-600 bg-emerald-500/10 text-hero-text font-bold"
                            : "border-border bg-card text-muted-foreground hover:border-border-strong"
                        }`}
                      >
                        <span className="block text-sm font-bold">10kg Crate</span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5 font-mono">
                          ৳{checkoutProduct.sale_price || checkoutProduct.price}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Shipping Form */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-hero-text block font-semibold">
                      Delivery Information
                    </label>

                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={checkoutForm.name}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500 text-xs font-medium"
                    />

                    <input
                      type="email"
                      required
                      placeholder="Email Address (for receipt & tracking)"
                      value={checkoutForm.email}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500 text-xs font-medium"
                    />

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-xs font-mono text-muted-foreground">
                        +880
                      </div>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        placeholder="Phone Number (10 digits)"
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-14 pr-4 py-2.5 rounded-xl bg-card border border-border text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500 text-xs font-medium"
                      />
                    </div>

                    <textarea
                      required
                      rows={2}
                      placeholder="Full Delivery Address (House, Road, Area, City)"
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500 text-xs font-medium resize-none"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-hero-text block font-semibold">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCheckoutForm((prev) => ({ ...prev, paymentMethod: "cod" }))}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-medium flex items-center justify-center gap-1.5 ${
                          checkoutForm.paymentMethod === "cod"
                            ? "border-emerald-600 bg-emerald-500/10 text-hero-text font-bold"
                            : "border-border bg-card text-muted-foreground hover:border-border-strong"
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Cash on Delivery</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckoutForm((prev) => ({ ...prev, paymentMethod: "bkash" }))}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-medium flex items-center justify-center gap-1.5 ${
                          checkoutForm.paymentMethod === "bkash"
                            ? "border-emerald-600 bg-emerald-500/10 text-hero-text font-bold"
                            : "border-border bg-card text-muted-foreground hover:border-border-strong"
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>bKash / Nagad</span>
                      </button>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="p-4 rounded-2xl bg-section-alt border border-border space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal ({selectedWeight}kg)</span>
                      <span className="font-mono">
                        ৳
                        {selectedWeight === 10
                          ? checkoutProduct.sale_price || checkoutProduct.price
                          : Math.round((checkoutProduct.sale_price || checkoutProduct.price) * 0.55)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Fee</span>
                      <span className="font-mono">৳120</span>
                    </div>
                    <div className="flex justify-between font-bold text-hero-text border-t border-border pt-2 text-sm">
                      <span>Total Amount</span>
                      <span className="font-mono">
                        ৳
                        {(selectedWeight === 10
                          ? checkoutProduct.sale_price || checkoutProduct.price
                          : Math.round((checkoutProduct.sale_price || checkoutProduct.price) * 0.55)) + 120}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm shadow-sm active:scale-98"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Express Order</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== ORDER TRACKING MODAL ====== */}
      {isTrackingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsTrackingOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-section-alt">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">
                  Live Harvest Traceability
                </span>
                <h3 className="text-lg font-bold tracking-tight text-hero-text mt-0.5">
                  Track Your Crate
                </h3>
              </div>
              <button
                onClick={() => setIsTrackingOpen(false)}
                className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-hero-text transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Search Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Order ID (e.g. MNG-8842)"
                  value={trackingIdInput}
                  onChange={(e) => setTrackingIdInput(e.target.value)}
                  className="grow px-4 py-2.5 rounded-xl bg-card border border-border text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500 text-xs font-mono font-medium uppercase"
                />
                <button
                  onClick={handleTrackingSearch}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Track
                </button>
              </div>

              {/* Status Timeline */}
              {searchedTrackingId && (
                <div className="space-y-5">
                  {ordersMap[searchedTrackingId] ? (
                    (() => {
                      const order = ordersMap[searchedTrackingId];
                      const steps = [
                        { key: "orchard", title: "Orchard Selected", subtitle: "Handpicked from partner orchard" },
                        { key: "quality", title: "Quality Verification", subtitle: "Cleaned & certified carbide-free" },
                        { key: "packed", title: "Eco-Crate Packed", subtitle: "Securely boxed in cushioned wooden crate" },
                        { key: "shipping", title: "Dispatched", subtitle: "En route via dedicated cold-chain" },
                        { key: "delivered", title: "Delivered", subtitle: "Delivered fresh to your doorstep" },
                      ];

                      const orderStatusIndex = steps.findIndex((s) => s.key === order.status);

                      return (
                        <div className="space-y-5">
                          {/* Brief Info */}
                          <div className="p-3.5 rounded-xl bg-section-alt border border-border flex justify-between items-center text-xs">
                            <div>
                              <span className="text-muted-foreground block text-[10px] font-mono">Variety</span>
                              <span className="font-bold text-hero-text">
                                {order.productName} ({order.weight})
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-muted-foreground block text-[10px] font-mono">Last Update</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                {order.date}
                              </span>
                            </div>
                          </div>

                          {/* Steps Timeline */}
                          <div className="relative pl-6 border-l border-border space-y-5 ml-3">
                            {steps.map((step, idx) => {
                              const isCompleted = idx < orderStatusIndex;
                              const isActive = idx === orderStatusIndex;

                              return (
                                <div key={step.key} className="relative">
                                  <div
                                    className={`absolute left-[-31px] top-0.5 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                                      isCompleted
                                        ? "bg-emerald-600 border-emerald-600 text-white"
                                        : isActive
                                          ? "bg-card border-emerald-500 animate-pulse"
                                          : "bg-card border-border"
                                    }`}
                                  >
                                    {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>

                                  <div className="space-y-0.5">
                                    <h4
                                      className={`text-xs font-bold ${
                                        isCompleted || isActive ? "text-hero-text" : "text-muted-foreground"
                                      }`}
                                    >
                                      {step.title}
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground">
                                      {isActive ? order.details : step.subtitle}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-6 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                      <p className="text-xs font-bold text-rose-500">Order Reference Not Found</p>
                      <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                        Please check the ID (e.g. <strong>MNG-8842</strong>) or place a new order.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Demo IDs Shortcut */}
              {!searchedTrackingId && (
                <div className="p-4 rounded-2xl bg-section-alt border border-border space-y-2">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Test Demo Order IDs:
                  </h4>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>
                      •{" "}
                      <span
                        className="text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:underline"
                        onClick={() => {
                          setTrackingIdInput("MNG-8842");
                          setSearchedTrackingId("MNG-8842");
                        }}
                      >
                        MNG-8842
                      </span>{" "}
                      <span className="text-muted-foreground">(Packed in Crate)</span>
                    </li>
                    <li>
                      •{" "}
                      <span
                        className="text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:underline"
                        onClick={() => {
                          setTrackingIdInput("MNG-7731");
                          setSearchedTrackingId("MNG-7731");
                        }}
                      >
                        MNG-7731
                      </span>{" "}
                      <span className="text-muted-foreground">(Delivered)</span>
                    </li>
                    <li>
                      •{" "}
                      <span
                        className="text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:underline"
                        onClick={() => {
                          setTrackingIdInput("MNG-9910");
                          setSearchedTrackingId("MNG-9910");
                        }}
                      >
                        MNG-9910
                      </span>{" "}
                      <span className="text-muted-foreground">(Harvest Selected)</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
        />
      )}

      <WhatsAppWidget />

      {/* Fly-To-Cart Animation Overlay */}
      {flyingItems.map((item) => (
        <div
          key={item.id}
          className="fixed z-[9999] pointer-events-none rounded-full overflow-hidden shadow-2xl border-2 border-emerald-500 bg-white"
          style={
            {
              "--start-x": `${item.startX}px`,
              "--start-y": `${item.startY}px`,
              "--target-x": `${item.targetX}px`,
              "--target-y": `${item.targetY}px`,
              left: 0,
              top: 0,
              width: "40px",
              height: "40px",
              animation: "fly-to-cart 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
            } as React.CSSProperties
          }
        >
          <Image src={item.img} alt="" fill className="object-cover" />
        </div>
      ))}
      <style jsx global>{`
        @keyframes fly-to-cart {
          0% {
            transform: translate(var(--start-x), var(--start-y)) scale(1);
            opacity: 1;
          }
          40% {
            transform: translate(
                calc(var(--start-x) + (var(--target-x) - var(--start-x)) * 0.1),
                calc(var(--start-y) - 60px)
              )
              scale(1.1) rotate(10deg);
            opacity: 1;
            box-shadow: 0 10px 25px rgba(16, 185, 129, 0.35);
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) scale(0.1) rotate(90deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
