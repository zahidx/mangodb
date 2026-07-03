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
    X,
    Zap
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
    email: "",
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
            total,
            productName: `${checkoutProduct.name} (${selectedWeight}kg)`,
            shippingAddress: checkoutForm.address,
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
      <div className="grow flex flex-col relative z-10 pt-16">
        
        {/* 1. Hero Section (Rustic background, white text, green buttons) */}
        <section className="relative w-full h-[550px] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
             <Image src="https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=1600&auto=format&fit=crop&q=80" alt="Gardeners" fill className="object-cover brightness-50" />
          </div>
          <div className="relative z-10 text-center max-w-4xl px-4 flex flex-col items-center">
             <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
               Fresh & Chemical-Free<br />Mangoes from Rajshahi
             </h1>
             <p className="text-lg text-gray-200 mb-8 max-w-2xl">
               Taste the sweetness of pure, carbide-free premium mangoes. Handpicked from our contracted orchards and delivered directly to your home.
             </p>
             <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/products" className="px-8 py-3.5 bg-transparent border-2 border-[#527d62] text-white hover:bg-[#527d62] hover:border-transparent font-bold rounded transition-all">
                  Our Contracted Gardens
                </Link>
                <Link href="/products" className="px-8 py-3.5 bg-[#527d62] text-white font-bold rounded border-2 border-[#527d62] hover:bg-[#436750] hover:border-[#436750] transition-all">
                  Try our fruits
                </Link>
             </div>
          </div>
        </section>

        {/* 2. Category Navigation Tabs */}
        <section className="max-w-7xl mx-auto w-full px-4 -mt-8 relative z-20">
           <div className="flex flex-wrap items-center justify-center gap-3">
              {['All Products', 'Combo Package', 'Mango', 'Dragon Fruit'].map((cat, i) => (
                 <Link key={i} href="/products" className={`px-6 py-3 rounded-full text-sm font-bold shadow-md transition-all ${i === 0 ? 'bg-[#527d62] text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100'}`}>
                    {cat}
                 </Link>
              ))}
           </div>
        </section>

        {/* 3. All Products Grid (Retail format like products page) */}
        <section className="py-16 max-w-7xl mx-auto w-full px-4">
           <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-gray-800">Our Premium Products</h2>
              <div className="w-16 h-1 bg-[#527d62] mx-auto mt-4 rounded"></div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(prod => (
                 <div key={prod.id} className="group bg-white rounded-md overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden shrink-0 bg-gray-50">
                      <Link href={`/products/${prod.slug}`} className="block w-full h-full cursor-pointer">
                        <Image src={prod.image} alt={prod.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-black bg-[#FFC107] rounded-sm shadow-sm z-10">
                          <Truck className="w-3 h-3" /> Free Delivery
                        </span>
                      </Link>
                      <button onClick={(e) => { e.stopPropagation(); toggleWishlist(prod.id); }} className="absolute top-2 left-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-colors z-20 cursor-pointer">
                        <Heart className={`w-4 h-4 ${wishlist.includes(prod.id) ? "fill-red-500 text-red-500 border-none" : ""}`} />
                      </button>
                    </div>
                    <div className="p-4 flex flex-col grow justify-between space-y-3">
                      <Link href={`/products/${prod.slug}`} className="space-y-1 block group-hover:opacity-95">
                        <h3 className="font-sans font-bold text-gray-800 text-[15px] leading-tight line-clamp-2">{prod.name}</h3>
                        <div className="text-[11px] text-gray-500 leading-relaxed pt-1">
                          <p>5/10/20 Kg Package Available.</p>
                          <p>Approximate Delivery Date Within 6-8 July</p>
                        </div>
                      </Link>
                      <div className="flex flex-col gap-3 pt-1">
                        <div className="text-[#4A7C59] font-bold text-[17px]">
                          {prod.sale_price ? <span>৳ {prod.sale_price} - ৳ {prod.sale_price * 3}</span> : <span>৳ {prod.price} - ৳ {prod.price * 4}</span>}
                        </div>
                        <button onClick={() => { setCheckoutProduct(prod); setSelectedWeight(10); setIsCheckoutOpen(true); }} className="flex items-center justify-center gap-1.5 w-[110px] py-2 bg-[#527d62] hover:bg-[#436750] text-white rounded-md transition-colors cursor-pointer active:scale-95 text-xs font-semibold shadow-sm" title="Buy Now">
                          <Zap className="w-3.5 h-3.5 fill-white" /> Buy Now
                        </button>
                      </div>
                    </div>
                 </div>
              ))}
           </div>
           
           <div className="mt-10 text-center">
              <Link href="/products" className="inline-flex items-center justify-center px-8 py-3 bg-white border border-gray-200 text-gray-800 font-bold rounded hover:bg-gray-50 transition-colors shadow-sm">
                 View All Products
              </Link>
           </div>
        </section>

        {/* 4. Why We Are Different */}
        <section className="py-16 bg-white border-y border-gray-100">
           <div className="max-w-7xl mx-auto w-full px-4">
              <div className="text-center mb-12">
                 <h2 className="text-3xl font-black text-gray-800">Why We Are Different</h2>
                 <div className="w-16 h-1 bg-[#FFC107] mx-auto mt-4 rounded"></div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                 {/* Left Feature image card */}
                 <div className="relative rounded-2xl overflow-hidden h-[400px] flex items-end p-8 shadow-lg">
                    <Image src="https://images.unsplash.com/photo-1552474030-b3a5b5f04e2e?w=800&auto=format&fit=crop&q=80" alt="Premium Mangoes" fill className="object-cover absolute inset-0 z-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                    <div className="relative z-20 text-white">
                       <h3 className="text-2xl font-bold mb-2">Registered Safe Garden</h3>
                       <p className="text-gray-200 text-sm leading-relaxed max-w-sm">We source directly from gardens certified for safe farming practices, ensuring chemical-free, fresh produce for you and your family.</p>
                    </div>
                 </div>
                 
                 {/* Right small cards */}
                 <div className="grid gap-4">
                    {[
                      { title: "Premium Quality", icon: Award, desc: "Only the finest, export-quality handpicked mangoes." },
                      { title: "Premium Packaging", icon: Package, desc: "Safe, beautiful, and sustainable packaging ensuring zero damage." },
                      { title: "Garden Fresh Delivery", icon: Truck, desc: "Delivered straight from the orchards to your doorstep within 48 hours." }
                    ].map((feature, idx) => (
                       <div key={idx} className="flex items-center gap-6 p-6 rounded-2xl bg-[#f8f9fa] border border-gray-100 hover:shadow-md transition-shadow">
                          <div className="w-14 h-14 rounded-full bg-[#e6f0eb] flex items-center justify-center shrink-0">
                             <feature.icon className="w-7 h-7 text-[#527d62]" />
                          </div>
                          <div>
                             <h4 className="text-lg font-bold text-gray-800 mb-1">{feature.title}</h4>
                             <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* 5. Gift Premium Mangoes (Promo) */}
        <section className="py-20 bg-[#e6f0eb]">
           <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2 space-y-6">
                 <h2 className="text-4xl font-black text-[#0D2319] leading-tight">Gift Premium Mangoes!</h2>
                 <p className="text-lg text-[#133824]/80 leading-relaxed">
                   Send a box of happiness to your loved ones. Our premium mangoes come in beautiful gift boxes, perfect for corporate gifting or sending love to friends and family.
                 </p>
                 <Link href="/products?category=gifts" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#527d62] hover:bg-[#436750] text-white font-bold rounded transition-all shadow-lg">
                    Order Gift Box <ArrowRight className="w-4 h-4" />
                 </Link>
              </div>
              <div className="md:w-1/2">
                 <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                    <Image src="https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&auto=format&fit=crop&q=80" alt="Gift Box" fill className="object-cover" />
                 </div>
              </div>
           </div>
        </section>

        {/* 6. Training & Farmer Collaboration */}
        <section className="py-20 bg-white">
           <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-12">
                 <h2 className="text-3xl font-black text-gray-800">Training & Farmer Collaboration</h2>
                 <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Empowering local farmers with modern, safe agricultural practices.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                 {[
                   { title: "Soil Management", image: "https://images.unsplash.com/photo-1592982537447-6f2334816be5?w=600&auto=format&fit=crop&q=80" },
                   { title: "Safe Pest Control", image: "https://images.unsplash.com/photo-1589923158776-cb4485d99fd6?w=600&auto=format&fit=crop&q=80" },
                   { title: "Harvesting Techniques", image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&auto=format&fit=crop&q=80" }
                 ].map((item, i) => (
                    <div key={i} className="p-4 border-2 border-dashed border-[#527d62]/30 rounded-2xl flex flex-col items-center text-center hover:bg-[#f8f9fa] transition-colors cursor-pointer">
                       <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
                          <Image src={item.image} alt={item.title} fill className="object-cover" />
                       </div>
                       <h4 className="font-bold text-gray-800">{item.title}</h4>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* 7. Customer Reviews Section */}
        <section className="py-20 bg-[#f8f9fa] border-t border-gray-100 overflow-hidden">
           <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center">
              <div className="text-center flex flex-col items-center justify-center mb-16 max-w-2xl">
                 <h2 className="text-3xl font-black text-gray-800">Customer review</h2>
                 <div className="w-16 h-1 bg-[#527d62] mt-4 rounded"></div>
              </div>
           </div>

           {/* Infinite Marquee Slider Container */}
           <div className="relative w-full overflow-hidden select-none">
              {/* Fade Overlay left */}
              <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#f8f9fa] to-transparent z-10 pointer-events-none" />
              {/* Fade Overlay right */}
              <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#f8f9fa] to-transparent z-10 pointer-events-none" />

              <div className="animate-marquee hover:[animation-play-state:paused] flex gap-6 px-4">
                 {[
                   {
                     name: "Tahmid Hasan",
                     location: "Gulshan, Dhaka",
                     rating: 5,
                     comment: "Absolutely unmatched sweet taste! The Rajshahi Himsagar was incredibly fresh, naturally ripe, and had zero fiber. Ordering again next season!",
                     date: "July 2, 2026",
                     avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                   },
                   {
                     name: "Nusrat Jahan",
                     location: "Dhanmondi, Dhaka",
                     rating: 5,
                     comment: "I was highly skeptical about buying mangoes online due to formalin scares, but MangoDB's safe, certified orchards promise was 100% true. Fresh and sweet!",
                     date: "June 29, 2026",
                     avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                   },
                   {
                     name: "Sajid Rahman",
                     location: "Chittagong",
                     rating: 5,
                     comment: "The packaging was outstanding. Sturdy ventilated wooden box, every single mango cushioned. Delivery arrived perfectly safe within 48 hours.",
                     date: "June 28, 2026",
                     avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                   },
                   {
                     name: "Farhana Yasmin",
                     location: "Uttara, Dhaka",
                     rating: 5,
                     comment: "Best Langra mangoes I've ever had! Perfectly sweet, juicy, and prompt delivery. Highly recommend MangoDB for anyone looking for authentic taste.",
                     date: "June 25, 2026",
                     avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
                   }
                 ].concat([
                   {
                     name: "Tahmid Hasan",
                     location: "Gulshan, Dhaka",
                     rating: 5,
                     comment: "Absolutely unmatched sweet taste! The Rajshahi Himsagar was incredibly fresh, naturally ripe, and had zero fiber. Ordering again next season!",
                     date: "July 2, 2026",
                     avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                   },
                   {
                     name: "Nusrat Jahan",
                     location: "Dhanmondi, Dhaka",
                     rating: 5,
                     comment: "I was highly skeptical about buying mangoes online due to formalin scares, but MangoDB's safe, certified orchards promise was 100% true. Fresh and sweet!",
                     date: "June 29, 2026",
                     avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                   },
                   {
                     name: "Sajid Rahman",
                     location: "Chittagong",
                     rating: 5,
                     comment: "The packaging was outstanding. Sturdy ventilated wooden box, every single mango cushioned. Delivery arrived perfectly safe within 48 hours.",
                     date: "June 28, 2026",
                     avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                   },
                   {
                     name: "Farhana Yasmin",
                     location: "Uttara, Dhaka",
                     rating: 5,
                     comment: "Best Langra mangoes I've ever had! Perfectly sweet, juicy, and prompt delivery. Highly recommend MangoDB for anyone looking for authentic taste.",
                     date: "June 25, 2026",
                     avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
                   }
                 ]).map((review, i) => (
                    <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between w-[320px] sm:w-[380px] shrink-0">
                       <div>
                          <div className="flex items-center gap-1 text-[#fbbf24] mb-4">
                             {[...Array(review.rating)].map((_, idx) => (
                                <Star key={idx} className="w-4 h-4 fill-current" />
                             ))}
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed italic mb-6">"{review.comment}"</p>
                       </div>
                       
                       <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                             <Image src={review.avatar} alt={review.name} fill className="object-cover" />
                          </div>
                          <div>
                             <h4 className="font-bold text-gray-800 text-sm">{review.name}</h4>
                             <p className="text-xs text-gray-400">{review.location} • <span className="text-[#527d62] font-semibold">Verified Buyer</span></p>
                          </div>
                       </div>
                    </div>
                 ))}
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
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-border">
                      <Image src={checkoutProduct.image} alt={checkoutProduct.name} fill sizes="80px" className="object-cover" />
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
                        <input
                          type="email"
                          required
                          placeholder="Email Address (for receipt)"
                          value={checkoutForm.email}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
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
