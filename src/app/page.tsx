"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowRight,
    Award,
    Check,
    CheckCircle2,
    Coins,
    CreditCard,
    Droplets,
    Heart,
    Leaf,
    Loader2,
    Package,
    Play,
    Search,
    Shield,
    ShoppingBag,
    Sparkles,
    Star,
    Truck,
    X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function HomePage() {
  const { profile: user } = useAuth();
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
    phone: "",
    address: "",
    paymentMethod: "cod"
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
  
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const savedWish = localStorage.getItem("mangodb-wishlist");
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
    localStorage.setItem("mangodb-wishlist", JSON.stringify(nextWish));
  };

  // Prefill shipping info if user is logged in
  useEffect(() => {
    if (user) {
      setCheckoutForm(prev => ({
        ...prev,
        name: user.full_name || "",
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
    const existingOrders = JSON.parse(localStorage.getItem("mangodb-orders") || "[]");
    localStorage.setItem("mangodb-orders", JSON.stringify([orderData, ...existingOrders]));

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
    const stored = JSON.parse(localStorage.getItem("mangodb-orders") || "[]");
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

  // Localized premium Bangladeshi mango varieties
  const featuredProducts = [
    {
      id: "1",
      name: "Rajshahi Himsagar",
      slug: "himsagar-mangoes",
      category: "Premium Grade",
      price: 1200,
      sale_price: 999,
      rating: 4.9,
      reviews: 412,
      image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80",
      badge: "King of Bengal",
    },
    {
      id: "2",
      name: "Rangpur Haribhanga",
      slug: "haribhanga-mangoes",
      category: "Premium Grade",
      price: 1400,
      sale_price: null,
      rating: 4.8,
      reviews: 287,
      image: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&auto=format&fit=crop&q=80",
      badge: "Fleshy & Fiberless",
    },
    {
      id: "3",
      name: "Chapainawabganj Lengra",
      slug: "lengra-mangoes",
      category: "Classic Selection",
      price: 1100,
      sale_price: 950,
      rating: 4.7,
      reviews: 198,
      image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&auto=format&fit=crop&q=80",
      badge: "Aromatic Delight",
    },
    {
      id: "4",
      name: "Premium Amrapali",
      slug: "amrapali-mangoes",
      category: "Classic Selection",
      price: 1300,
      sale_price: 1150,
      rating: 4.8,
      reviews: 212,
      image: "https://images.unsplash.com/photo-1552474030-b3a5b5f04e2e?w=600&auto=format&fit=crop&q=80",
      badge: "Intensely Sweet",
    },
  ];

  // Mango categories
  const categories = [
    { name: "Organic Harvest", slug: "organic", count: "10+ orchards", icon: Leaf, color: "from-emerald-500/20 to-green-600/20", border: "hover:border-emerald-500/30" },
    { name: "Premium Crates", slug: "premium", count: "6+ varieties", icon: Award, color: "from-amber-500/20 to-yellow-600/20", border: "hover:border-amber-500/30" },
    { name: "Festival Gift Boxes", slug: "gifts", count: "4 options", icon: Package, color: "from-pink-500/20 to-rose-600/20", border: "hover:border-pink-500/30" },
    { name: "Aamsotto & Dried", slug: "dried", count: "3 varieties", icon: Droplets, color: "from-orange-500/20 to-red-600/20", border: "hover:border-orange-500/30" },
    { name: "Pure Mango Pulp", slug: "pulp", count: "Pure & Fresh", icon: ShoppingBag, color: "from-purple-500/20 to-indigo-600/20", border: "hover:border-purple-500/30" },
    { name: "Seasonal Specials", slug: "seasonal", count: "Limited stock", icon: Sparkles, color: "from-violet-500/20 to-purple-600/20", border: "hover:border-violet-500/30" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-[#fbbf24] selection:text-black relative flex flex-col transition-colors duration-200">
      {/* Background Glowing Orbs */}
      <div className="glow-orb glow-orb-mango w-[500px] h-[500px] top-[-100px] left-[-100px] opacity-40 animate-pulse-slow" />
      <div className="glow-orb glow-orb-purple w-[600px] h-[600px] top-[20%] right-[-100px] opacity-30 animate-pulse-slow delay-300" />
      <div className="glow-orb glow-orb-blue w-[400px] h-[400px] bottom-[10%] left-[10%] opacity-20 animate-pulse-slow delay-500" />

      <Navbar />

      {/* ====== MAIN CONTENT WRAPPER ====== */}
      <div className="grow flex flex-col relative z-10">
        
        {/* ====== HERO SECTION ====== */}
        <section className="relative min-h-[calc(100vh-5rem)] flex items-center overflow-hidden bg-gradient-to-b from-[#f2f7f4] to-[#eaf1ec] dark:from-background dark:to-background">
          
          {/* Background Orbs */}
          <div className="absolute -top-50 -left-25 w-150 h-150 rounded-full bg-primary/8 dark:bg-primary/5 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-37.5 -right-25 w-125 h-125 rounded-full bg-accent/6 dark:bg-accent/3 blur-[120px] pointer-events-none" />

          {/* Decorative leaf */}
          <div className="absolute top-[15%] right-[10%] text-accent/8 dark:text-accent-light/5 animate-leaf-1 pointer-events-none">
            <Leaf className="w-24 h-24 rotate-12" strokeWidth={1.5} />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* ===== LEFT — Content ===== */}
              <div className="space-y-7 text-center lg:text-left pt-[40px]">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/8 dark:bg-accent/10 border border-accent/20 dark:border-accent/20 text-xs font-semibold text-accent-dark dark:text-accent-light tracking-wide opacity-0 animate-hero-slide-up hero-delay-1">
                  <Leaf className="w-3 h-3" />
                  <span>Rajshahi Orchard Fresh</span>
                </div>

                {/* Heading */}
                <h1 className="font-serif-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-hero-text opacity-0 animate-hero-slide-up hero-delay-2">
                  Explore the Finest
                  <br />
                  <span className="text-primary-dark">Mango Selection</span>
                </h1>

                {/* Subheading */}
                <p className="text-base sm:text-lg text-hero-text-secondary max-w-lg mx-auto lg:mx-0 leading-relaxed opacity-0 animate-hero-slide-up hero-delay-3">
                  Taste the sweetness of pure, carbide-free premium mangoes — handpicked from the historic orchards of Rajshahi and delivered to your doorstep across Bangladesh.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 opacity-0 animate-hero-slide-up hero-delay-4">
                  <Link
                    href="/products"
                    className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-black font-bold rounded-xl transition-all duration-200 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.97] flex items-center gap-2 group"
                  >
                    Shop Mangoes
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/#varieties"
                    className="px-8 py-3.5 border border-border text-hero-text-secondary font-semibold rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200 active:scale-[0.97]"
                  >
                    Explore Varieties
                  </Link>
                </div>

                {/* Trust Bar */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 pt-2 opacity-0 animate-hero-slide-up hero-delay-5">
                  
                  {/* Stars */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <img className="w-8 h-8 rounded-full border-2 border-white dark:border-background object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="" />
                      <img className="w-8 h-8 rounded-full border-2 border-white dark:border-background object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80" alt="" />
                      <img className="w-8 h-8 rounded-full border-2 border-white dark:border-background object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="" />
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-sm font-bold text-hero-text ml-1">4.9</span>
                      <span className="text-xs text-muted-foreground">(10K+ reviews)</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <span className="hidden sm:block w-px h-6 bg-border" />

                  {/* Quick stats */}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-hero-text-secondary">
                      <Truck className="w-3.5 h-3.5 text-accent" /> Free Delivery
                    </span>
                    <span className="flex items-center gap-1.5 text-hero-text-secondary">
                      <Shield className="w-3.5 h-3.5 text-accent" /> Carbide-Free
                    </span>
                    <span className="flex items-center gap-1.5 text-hero-text-secondary">
                      <Leaf className="w-3.5 h-3.5 text-accent" /> 15+ Varieties
                    </span>
                  </div>
                </div>

                {/* Search */}
                <div className="max-w-lg mx-auto lg:mx-0 pt-2 opacity-0 animate-hero-slide-up hero-delay-6">
                  <div className="flex items-center bg-white dark:bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
                    <Search className="w-4 h-4 text-muted-foreground mr-2.5 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search Himsagar, Lengra, Amrapali..."
                      className="w-full bg-transparent border-0 text-sm text-hero-text placeholder-muted-foreground focus:outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* ===== RIGHT — Visual Showcase ===== */}
              <div className="relative hidden lg:flex items-center justify-center pt-[60px]">
                
                {/* Main Image */}
                <div className="relative w-95 h-120 rounded-3xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/30 opacity-0 animate-hero-scale-in hero-delay-3 group">
                  <img 
                    src="https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80" 
                    alt="Premium mango selection"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  
                  {/* Bottom caption */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center gap-2 text-white">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Handpicked Premium Quality</span>
                    </div>
                  </div>
                </div>

                {/* Floating card — top right */}
                <div className="absolute top-[8%] -right-[5%] w-45 bg-white/95 dark:bg-card/95 backdrop-blur-lg rounded-xl border border-border/60 shadow-lg p-3.5 opacity-0 animate-reveal-card hero-delay-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      <img src="https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=200&auto=format&fit=crop&q=80" alt="Himsagar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Best Seller</p>
                      <p className="text-xs font-bold text-hero-text">Himsagar</p>
                      <p className="text-xs font-bold text-hero-text">৳999 <span className="text-[10px] text-muted-foreground line-through">৳1,200</span></p>
                    </div>
                  </div>
                </div>

                {/* Floating card — bottom left */}
                <div className="absolute bottom-[12%] -left-[6%] w-45 bg-white/95 dark:bg-card/95 backdrop-blur-lg rounded-xl border border-border/60 shadow-lg p-3.5 opacity-0 animate-reveal-card hero-delay-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      <img src="https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=200&auto=format&fit=crop&q=80" alt="Lengra" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-warning uppercase tracking-wider">Trending</p>
                      <p className="text-xs font-bold text-hero-text">Amrapali</p>
                      <p className="text-xs font-bold text-hero-text">৳1,150 <span className="text-[10px] text-muted-foreground line-through">৳1,300</span></p>
                    </div>
                  </div>
                </div>

                {/* Decorative ring */}
                <div className="absolute w-105 h-105 rounded-full border border-dashed border-primary/15 dark:border-primary/10 animate-rotate-slow pointer-events-none" />
              </div>

            </div>
          </div>
        </section>

        {/* Spacer between hero and sections below */}
        <div className="h-16 lg:h-20" />

        {/* ====== CATEGORIES SECTION ====== */}
        <section className="py-24 relative border-t border-border bg-section-alt">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
              <div className="space-y-3">
                <span className="inline-block text-xs font-bold text-accent-dark dark:text-accent-light tracking-[0.15em] uppercase">Pure Mango Goodness</span>
                <h2 className="font-serif-heading text-3xl sm:text-4xl font-bold text-hero-text tracking-tight">
                  Shop by Category
                </h2>
              </div>
              <Link
                href="/categories"
                className="mt-4 md:mt-0 flex items-center gap-2 text-sm font-semibold text-accent-dark dark:text-accent-light hover:text-hero-text transition-colors group"
              >
                View all categories
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <Link
                    key={cat.name}
                    href={`/categories/${cat.slug}`}
                    className={`group p-6 rounded-2xl bg-card border border-border ${cat.border} transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-6 h-6 text-accent-dark dark:text-accent-light" />
                    </div>
                    <h3 className="font-bold text-hero-text text-sm group-hover:text-primary transition-colors">{cat.name}</h3>
                    <span className="text-xs text-muted-foreground mt-1.5">{cat.count}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ====== FEATURED MANGOES SECTION ====== */}
        <section className="py-24 relative bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
              <div>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase block mb-2">Handpicked for You</span>
                <h2 className="font-serif-heading text-3xl sm:text-4xl font-bold text-hero-text tracking-tight">
                  Featured Mango Varieties
                </h2>
              </div>
              <Link
                href="/products"
                className="mt-4 md:mt-0 flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-[#34d399] hover:text-hero-text transition-colors group"
              >
                Browse all mangoes
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="group glass-card rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-48 w-full overflow-hidden shrink-0">
                    <Link href={`/products/${prod.slug}`} className="block w-full h-full cursor-pointer">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {prod.badge && (
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 text-[10px] font-extrabold text-black bg-[#fbbf24] rounded-full uppercase tracking-wider">
                          {prod.badge}
                        </span>
                      )}
                    </Link>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(prod.id);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/65 border border-white/5 hover:text-red-500 transition-colors cursor-pointer z-20"
                    >
                      <Heart className={`w-4 h-4 ${wishlist.includes(prod.id) ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                    </button>
                  </div>

                  <div className="p-5 flex flex-col grow justify-between space-y-4">
                    <Link href={`/products/${prod.slug}`} className="space-y-2 block cursor-pointer group-hover:opacity-95">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {prod.category}
                      </span>
                      <h3 className="font-serif-heading font-bold text-hero-text text-base line-clamp-2 group-hover:text-[#fbbf24] transition-colors">
                        {prod.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center text-[#fbbf24]">
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <span className="text-xs font-bold text-hero-text">{prod.rating}</span>
                        <span className="text-[10px] text-muted-foreground">({prod.reviews} reviews)</span>
                      </div>
                    </Link>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div>
                        {prod.sale_price ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground line-through">৳{prod.price}</span>
                            <span className="text-lg font-black text-hero-text">৳{prod.sale_price}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-black text-hero-text">৳{prod.price}</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setCheckoutProduct(prod);
                          setSelectedWeight(10);
                          setOrderSuccessId(null);
                          setIsCheckoutOpen(true);
                        }}
                        className="p-2.5 rounded-xl bg-muted-bg border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 text-foreground transition-all duration-300 shrink-0 cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== FARMER DASHBOARD SPOTLIGHT ====== */}
        <section className="py-24 relative bg-section-alt overflow-hidden border-t border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-14 items-center">
              {/* Left - Earnings Card */}
              <div className="lg:col-span-5 relative flex justify-center order-last lg:order-first">
                <div className="w-full max-w-90 p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-accent-dark dark:text-accent-light" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-hero-text">Farmer Earnings</h4>
                        <p className="text-[10px] text-muted-foreground font-medium">This Harvest Season</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-accent-dark dark:text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                      +32.4%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Net Revenue</p>
                    <h3 className="text-3xl font-black text-hero-text">৳1,82,400.00</h3>
                  </div>

                  <div className="flex items-end justify-between h-24 pt-4 gap-2">
                    {[45, 55, 35, 75, 65, 90, 80].map((h, i) => (
                      <div key={i} className="flex-1 bg-muted-bg rounded-md h-full relative overflow-hidden">
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-accent-dark to-accent rounded-md transition-all duration-1000"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-7 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent-dark dark:text-accent-light tracking-wide uppercase">
                  <Award className="w-4 h-4" />
                  <span>Sell With MangoDB</span>
                </div>
                <h2 className="font-serif-heading text-3xl sm:text-5xl font-bold text-hero-text leading-tight">
                  Turn Your Mango Orchard
                  <br />
                  Into a Profitable Business
                </h2>
                <p className="text-lg text-hero-text-secondary leading-relaxed">
                  Whether you grow Himsagar in Rajshahi, Haribhanga in Rangpur, or organic varieties in Chapainawabganj, MangoDB gives you the digital platform to list, market, and sell your harvest directly to customers nationwide.
                </p>
                <div className="space-y-4">
                  {[
                    "Keep up to 95% of every sale with minimal commission fees.",
                    "Get paid instantly into your bKash, Rocket, or Bank account upon delivery.",
                    "Access real-time sales analytics and weather-demand forecasting tools.",
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent-dark dark:text-accent-light mt-0.5 shrink-0" />
                      <span className="text-base text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Link
                    href="/signup?seller=true"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-black font-bold bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 whitespace-nowrap shrink-0 active:scale-[0.97]"
                  >
                    Start Selling As Farmer
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== BRAND STORY & VIDEO SECTION ====== */}
        <section className="py-24 relative bg-background border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* Left — Brand Story */}
              <div className="space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start lg:pl-[30px]">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent-dark dark:text-accent-light tracking-wide uppercase">
                  <Leaf className="w-4 h-4 text-primary" />
                  <span>The MangoDB Standard</span>
                </div>
                <h2 className="font-serif-heading text-3xl sm:text-4xl md:text-5xl font-bold text-hero-text leading-tight">
                  Harvested with Care,
                  <br />
                  Delivered with Integrity
                </h2>
                <p className="text-sm sm:text-base text-hero-text-secondary leading-relaxed max-w-md">
                  From the historic orchards of Kansat, Chapainawabganj, and the fertile soils of Rajshahi, our mission is to bring you the finest mangoes in their purest state.
                </p>
                <div className="space-y-5 w-full max-w-md">
                  <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-card border border-border">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent-dark dark:text-accent-light shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-hero-text">GAP Certified</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">Organic soil management & safe pest control.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-card border border-border">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary-dark dark:text-primary shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-hero-text">Carbide-Free</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">Naturally ripened on the branch, never chemically treated.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — Video Player */}
              <div>
                <div className="relative aspect-video rounded-3xl overflow-hidden glass-card p-2 shadow-2xl">
                  {!isPlayingVideo ? (
                    <div className="relative w-full h-full rounded-2xl overflow-hidden group cursor-pointer" onClick={() => setIsPlayingVideo(true)}>
                      <img 
                        src="https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=800&auto=format&fit=crop&q=80" 
                        alt="Mango Orchard"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:scale-110 active:scale-95 transition-all duration-300">
                          <Play className="w-8 h-8 text-black fill-current ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 px-4 py-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-primary">Watch Our Story</p>
                          <p className="text-[10px] text-slate-300">A journey through our Rajshahi orchards (2:45)</p>
                        </div>
                        <span className="text-[10px] bg-accent/20 text-accent-light font-bold px-2 py-1 rounded border border-accent/30">GAP Certified</span>
                      </div>
                    </div>
                  ) : (
                    <iframe 
                      className="w-full h-full rounded-2xl border-0"
                      src="https://www.youtube.com/embed/Qh_S5h-aVjU?autoplay=1" 
                      title="MangoDB Orchard Journey"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ====== CORE BENEFITS ====== */}
        <section className="py-24 bg-background relative">
          <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="text-center max-w-xl mb-14 space-y-3">
              <span className="inline-block text-xs font-bold text-accent-dark dark:text-accent-light tracking-[0.15em] uppercase">Why MangoDB?</span>
              <h2 className="font-serif-heading text-3xl sm:text-4xl font-bold text-hero-text tracking-tight">
                Freshness, Quality & Trust
              </h2>
              <p className="text-sm sm:text-base text-hero-text-secondary leading-relaxed">
                We connect mango lovers directly with verified orchard farmers for the freshest, safest experience.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 w-full max-w-5xl">
              {[
                {
                  icon: Shield,
                  title: "100% Food Safety",
                  description:
                     "We strictly prohibit chemical ripening agents. Every single mango is naturally ripened and checked for quality before shipping.",
                  color: "text-accent-dark dark:text-accent-light",
                  bg: "bg-accent/10",
                  border: "hover:border-accent/25",
                },
                {
                  icon: Truck,
                  title: "Express Crate Delivery",
                  description:
                    "Packed in ventilated paper-padded wooden crates to prevent bruising. Shipped through dedicated express logistics to arrive fresh.",
                  color: "text-primary-dark dark:text-primary",
                  bg: "bg-primary/10",
                  border: "hover:border-primary/25",
                },
                {
                  icon: Leaf,
                  title: "Orchard Direct Pricing",
                  description:
                    "No middleman. Your money goes directly to the hardworking farmers in Rajshahi and Rangpur, supporting local agriculture.",
                  color: "text-accent-dark dark:text-accent-light",
                  bg: "bg-accent/10",
                  border: "hover:border-accent/25",
                },
              ].map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className={`p-8 rounded-2xl bg-card border border-border ${benefit.border} transition-all duration-300 hover:-translate-y-0.5 flex flex-col items-center text-center`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${benefit.bg} flex items-center justify-center mb-5`}>
                      <Icon className={`w-6 h-6 ${benefit.color}`} />
                    </div>
                    <h3 className="font-serif-heading text-lg font-bold text-hero-text mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px]">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ====== CTA NEWSLETTER ====== */}
        <section className="relative overflow-hidden border-t border-border" style={{ background: 'linear-gradient(135deg, #1a3c2a 0%, #2d4a3a 25%, #1e3528 50%, #2a4636 75%, #1a3c2a 100%)' }}>
          {/* Dot texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          {/* Diagonal line texture */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 11px)',
            }}
          />

          {/* Warm glow orbs */}
          <div className="absolute w-[600px] h-[600px] rounded-full blur-[160px] -top-72 left-1/2 -translate-x-1/2 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.15), transparent 70%)' }} />
          <div className="absolute w-[400px] h-[400px] rounded-full blur-[120px] -bottom-48 -left-32 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.1), transparent 70%)' }} />
          <div className="absolute w-[400px] h-[400px] rounded-full blur-[120px] -bottom-48 -right-32 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.08), transparent 70%)' }} />

          <div className="relative z-10 w-full py-20 sm:py-28 lg:py-32 flex flex-col items-center justify-center px-4 sm:px-6">

            {/* Heading block */}
            <div className="max-w-2xl w-full text-center mb-8">
              <h2 className="font-serif-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.15] mb-4">
                Never Miss a Harvest
              </h2>
              <p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-md mx-auto">
                Subscribe to our harvest alerts and be the first to know when the fresh Himsagar, Lengra, or Haribhanga drops. Get exclusive early-bird prices.
              </p>
            </div>

            {/* Form */}
            <div className="w-full max-w-lg">
              <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="grow px-5 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[#fbbf24]/50 focus:ring-2 focus:ring-[#fbbf24]/20 focus:bg-white/15 text-sm font-medium transition-all"
                />
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold text-sm active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-[#fbbf24]/25 hover:shadow-xl hover:shadow-[#fbbf24]/30"
                >
                  Get Harvest Alerts
                </button>
              </form>
              <p className="text-xs text-white/40 text-center mt-3">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </section>

      </div>

      <Footer />

      {/* ====== EXPRESS CHECKOUT DRAWER ====== */}
      {isCheckoutOpen && checkoutProduct && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsCheckoutOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col h-full z-10 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-section-alt">
              <div>
                <h3 className="font-serif-heading text-xl font-bold text-hero-text">Express Checkout</h3>
                <p className="text-xs text-muted-foreground">Complete your order in 30 seconds</p>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="p-2 rounded-xl bg-muted-bg border border-border text-muted-foreground hover:text-hero-text transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Order Success State */}
              {orderSuccessId ? (
                <div className="text-center py-8 space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-serif-heading text-2xl font-bold text-hero-text">Order Confirmed!</h4>
                    <p className="text-sm text-muted-foreground">Thank you for shopping with MangoDB.</p>
                  </div>
                  <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 inline-block">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Your Order ID</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-wider mt-1">{orderSuccessId}</p>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Copy this ID and click <strong className="text-hero-text cursor-pointer hover:underline" onClick={() => { setIsCheckoutOpen(false); setTrackingIdInput(orderSuccessId); setSearchedTrackingId(orderSuccessId); setIsTrackingOpen(true); }}>Track Crate</strong> in the menu to watch your harvest timeline live!
                  </p>
                  <button
                    onClick={() => setIsCheckoutOpen(false)}
                    className="w-full py-3.5 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-black font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                  {/* Product Card */}
                  <div className="p-4 rounded-2xl bg-section-alt border border-border flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-border">
                      <img src={checkoutProduct.image} alt={checkoutProduct.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {checkoutProduct.badge || "Premium"}
                      </span>
                      <h4 className="font-serif-heading font-bold text-hero-text text-sm leading-tight">{checkoutProduct.name}</h4>
                      <p className="text-xs text-muted-foreground">Orchard Sourced · Carbide-Free</p>
                    </div>
                  </div>

                  {/* Weight Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-hero-text uppercase tracking-wider">Select Package Size</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedWeight(5)}
                        className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                          selectedWeight === 5 
                            ? 'border-emerald-500 bg-emerald-500/5 text-hero-text font-black' 
                            : 'border-border bg-card text-muted-foreground hover:border-border-hover'
                        }`}
                      >
                        <span className="block text-base font-bold">5kg Box</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          ৳{Math.round((checkoutProduct.sale_price || checkoutProduct.price) * 0.55)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedWeight(10)}
                        className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                          selectedWeight === 10 
                            ? 'border-emerald-500 bg-emerald-500/5 text-hero-text font-black' 
                            : 'border-border bg-card text-muted-foreground hover:border-border-hover'
                        }`}
                      >
                        <span className="block text-base font-bold">10kg Crate</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          ৳{checkoutProduct.sale_price || checkoutProduct.price}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Shipping Form */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-hero-text uppercase tracking-wider block">Delivery Details</label>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name"
                          value={checkoutForm.name}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 text-sm font-medium"
                        />
                      </div>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-sm font-semibold text-muted-foreground">
                          +880
                        </div>
                        <input
                          type="tel"
                          required
                          pattern="[0-9]{10}"
                          placeholder="Phone Number (10 digits)"
                          value={checkoutForm.phone}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full pl-16 pr-4 py-3 rounded-xl bg-input-bg border border-input-border text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 text-sm font-medium"
                        />
                      </div>

                      <div className="relative">
                        <textarea
                          required
                          rows={3}
                          placeholder="Full Delivery Address"
                          value={checkoutForm.address}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-input-bg border border-input-border text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 text-sm font-medium resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-hero-text uppercase tracking-wider block">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "cod" }))}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold flex items-center justify-center gap-2 ${
                          checkoutForm.paymentMethod === "cod" 
                            ? 'border-emerald-500 bg-emerald-500/5 text-hero-text font-bold' 
                            : 'border-border bg-card text-muted-foreground hover:border-border-hover'
                        }`}
                      >
                        <Coins className="w-4 h-4" />
                        Cash on Delivery
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "bkash" }))}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold flex items-center justify-center gap-2 ${
                          checkoutForm.paymentMethod === "bkash" 
                            ? 'border-emerald-500 bg-emerald-500/5 text-hero-text font-bold' 
                            : 'border-border bg-card text-muted-foreground hover:border-border-hover'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        bKash / Nagad
                      </button>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="p-4 rounded-2xl bg-section-alt border border-border space-y-2.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>
                        ৳{selectedWeight === 10 
                          ? (checkoutProduct.sale_price || checkoutProduct.price) 
                          : Math.round((checkoutProduct.sale_price || checkoutProduct.price) * 0.55)
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Fee</span>
                      <span>৳120</span>
                    </div>
                    <div className="flex justify-between font-black text-hero-text border-t border-border pt-2 text-base">
                      <span>Total Amount</span>
                      <span>
                        ৳{(selectedWeight === 10 
                          ? (checkoutProduct.sale_price || checkoutProduct.price) 
                          : Math.round((checkoutProduct.sale_price || checkoutProduct.price) * 0.55)
                        ) + 120}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full py-4 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-black font-extrabold rounded-xl hover:shadow-lg hover:shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing Order...
                      </>
                    ) : (
                      <>
                        Confirm Order (৳{(selectedWeight === 10 
                          ? (checkoutProduct.sale_price || checkoutProduct.price) 
                          : Math.round((checkoutProduct.sale_price || checkoutProduct.price) * 0.55)
                        ) + 120})
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
            className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsTrackingOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-section-alt">
              <div>
                <h3 className="font-serif-heading text-xl font-bold text-hero-text">Track Your Crate</h3>
                <p className="text-xs text-muted-foreground font-sans">Check your handpicked harvest and shipping timeline</p>
              </div>
              <button 
                onClick={() => setIsTrackingOpen(false)}
                className="p-2 rounded-xl bg-muted-bg border border-border text-muted-foreground hover:text-hero-text transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
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
                  className="grow px-4 py-3 rounded-xl bg-input-bg border border-input-border text-hero-text placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 text-sm font-medium uppercase"
                />
                <button
                  onClick={handleTrackingSearch}
                  className="px-5 py-3 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-black font-bold rounded-xl hover:shadow-md active:scale-95 transition-all text-sm cursor-pointer"
                >
                  Track
                </button>
              </div>

              {/* Status Display */}
              {searchedTrackingId && (
                <div className="space-y-6">
                  {ordersMap[searchedTrackingId] ? (
                    (() => {
                      const order = ordersMap[searchedTrackingId];
                      const steps: { key: string; title: string; subtitle: string }[] = [
                        { key: "orchard", title: "Orchard Selected", subtitle: "Handpicked from verified partners" },
                        { key: "quality", title: "Quality Verification", subtitle: "Cleaned and certified carbide-free" },
                        { key: "packed", title: "Eco-Crate Packed", subtitle: "Securely boxed in cushioned wooden crates" },
                        { key: "shipping", title: "Dispatched", subtitle: "En route via dedicated cold-chain courier" },
                        { key: "delivered", title: "Delivered", subtitle: "Enjoy your fresh premium mangoes!" },
                      ];

                      // Determine progress index
                      const orderStatusIndex = steps.findIndex(s => s.key === order.status);

                      return (
                        <div className="space-y-5 animate-fade-in">
                          {/* Order Brief Info */}
                          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex justify-between items-center text-xs">
                            <div>
                              <span className="text-muted-foreground block font-medium">Product Name</span>
                              <span className="font-bold text-hero-text">{order.productName} ({order.weight})</span>
                            </div>
                            <div className="text-right">
                              <span className="text-muted-foreground block font-medium">Last Update</span>
                              <span className="font-bold text-[#fbbf24]">{order.date}</span>
                            </div>
                          </div>

                          {/* Timeline Steps */}
                          <div className="relative pl-6 border-l border-border space-y-6 ml-3">
                            {steps.map((step, idx) => {
                              const isCompleted = idx < orderStatusIndex;
                              const isActive = idx === orderStatusIndex;
                              const isPending = idx > orderStatusIndex;

                              return (
                                <div key={step.key} className="relative">
                                  {/* Dot */}
                                  <div className={`absolute left-[-31px] top-1 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                                    isCompleted 
                                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                                      : isActive 
                                        ? 'bg-card border-[#fbbf24] animate-pulse' 
                                        : 'bg-card border-border'
                                  }`}>
                                    {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>

                                  {/* Text */}
                                  <div className="space-y-0.5">
                                    <h4 className={`text-sm font-bold ${
                                      isCompleted || isActive ? 'text-hero-text' : 'text-muted-foreground'
                                    }`}>
                                      {step.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground font-sans">
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
                    <div className="text-center py-6 space-y-2 bg-red-500/5 rounded-2xl border border-red-500/10">
                      <p className="text-sm font-bold text-red-500">Order Not Found</p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Please verify the ID (e.g. <strong>MNG-8842</strong>, <strong>MNG-7731</strong>) or place a new order using Express Checkout.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Helpful Tips */}
              {!searchedTrackingId && (
                <div className="p-4 rounded-2xl bg-section-alt border border-border space-y-2">
                  <h4 className="text-xs font-bold text-hero-text uppercase tracking-wider">Demo Order IDs to test:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1.5 font-mono">
                    <li>• <strong className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline" onClick={() => { setTrackingIdInput("MNG-8842"); setSearchedTrackingId("MNG-8842"); }}>MNG-8842</strong> (Status: Packed)</li>
                    <li>• <strong className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline" onClick={() => { setTrackingIdInput("MNG-7731"); setSearchedTrackingId("MNG-7731"); }}>MNG-7731</strong> (Status: Delivered)</li>
                    <li>• <strong className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline" onClick={() => { setTrackingIdInput("MNG-9910"); setSearchedTrackingId("MNG-9910"); }}>MNG-9910</strong> (Status: Orchard Selected)</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
