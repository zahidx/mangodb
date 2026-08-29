"use client";

import ImageZoom from "@/components/ImageZoom";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types/database";
import { Heart, Loader2, MapPin, Minus, Plus, Scale, ShoppingBag, Star, X, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
}

export default function QuickViewModal({
  product,
  onClose,
  wishlist,
  onToggleWishlist,
}: QuickViewModalProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [selectedWeight, setSelectedWeight] = useState("10kg");
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const weightOpts = ((product.metadata as any)?.weight_options as string[]) || ["5kg", "10kg"];
  const basePrice = product.sale_price || product.price;

  // Compute scaled price
  let multiplier = 1;
  if (selectedWeight === "5kg") multiplier = 0.55;
  else if (selectedWeight === "2kg") multiplier = 0.25;
  else if (selectedWeight === "1kg") multiplier = 0.13;
  const scaledPrice = Math.round(basePrice * multiplier);

  const allImages = product.images?.length ? product.images : [];
  const origin = (product.metadata as any)?.origin_district || "Rajshahi";
  const badge = (product.metadata as any)?.badge;
  const isWished = wishlist.includes(product.id);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addToCart(product, quantity, selectedWeight);
      toast.success(`${product.name} added to cart!`);
      onClose();
    } catch {
      toast.error("Could not add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await addToCart(product, quantity, selectedWeight, false);
    onClose();
    router.push("/checkout");
  };

  const isInWishlist = wishlist.includes(product.id);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickview-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-fade-in flex flex-col max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close product quick view modal"
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="flex flex-col md:flex-row overflow-y-auto">
          {/* Left — Image Gallery */}
          <div className="md:w-1/2 bg-gray-50 p-4 sm:p-6 flex flex-col gap-3">
            <div className="relative h-64 sm:h-80 w-full rounded-xl overflow-hidden bg-white border border-gray-100">
              <ImageZoom
                src={allImages[activeImageIdx] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"}
                alt={product.name}
                className="w-full h-full"
                zoom={2.5}
                lensSize={100}
              />
              {badge && (
                <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-black text-black bg-[#fbbf24] rounded-full uppercase tracking-wider shadow-md">
                  {badge}
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      idx === activeImageIdx
                        ? "border-emerald-500 ring-2 ring-emerald-500/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Product Details */}
          <div className="md:w-1/2 p-5 sm:p-6 flex flex-col gap-4">
            {/* Origin & Rating */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {origin}
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-gray-700">4.8</span>
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                {product.name}
              </h2>
              {product.category && (
                <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                  Category: {product.category.name}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Price</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                  ৳&nbsp;{scaledPrice.toLocaleString("en-BD")}
                </span>
                <span className="text-xs text-gray-500 font-medium">for {selectedWeight}</span>
              </div>
              {product.sale_price && (
                <p className="text-[11px] text-gray-400 mt-0.5 line-through">
                  ৳ {product.price.toLocaleString("en-BD")}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <p className={`text-xs sm:text-sm text-gray-600 leading-relaxed ${
                showFullDescription ? "" : "line-clamp-3"
              }`}>
                {product.description || "No description available."}
              </p>
              {product.description && product.description.length > 120 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 mt-1 cursor-pointer"
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </button>
              )}
            </div>

            {/* Weight Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1 mb-2">
                <Scale className="w-3.5 h-3.5" />
                Weight
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["1kg", "2kg", "5kg", "10kg"].map((wt) => {
                  const available = weightOpts.includes(wt);
                  return (
                    <button
                      key={wt}
                      disabled={!available}
                      onClick={() => setSelectedWeight(wt)}
                      className={`py-2 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                        !available
                          ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through"
                          : selectedWeight === wt
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"
                      }`}
                    >
                      {wt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase text-gray-500">Qty</span>
              <div className="flex items-center border border-gray-200 rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 text-gray-600" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2 hover:bg-gray-50 transition-colors cursor-pointer"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                {product.stock} available
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 mt-1">
              <button
                onClick={handleBuyNow}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#527d62] hover:bg-[#436750] text-white rounded-lg transition-colors cursor-pointer active:scale-95 text-xs font-bold shadow-sm"
              >
                <Zap className="w-4 h-4 fill-white" />
                Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border-2 border-[#527d62] text-[#527d62] hover:bg-[#527d62]/10 rounded-lg transition-colors cursor-pointer active:scale-95 text-xs font-bold disabled:opacity-50"
              >
                {addingToCart ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingBag className="w-4 h-4" />
                )}
                {addingToCart ? "Adding..." : "Add to Cart"}
              </button>
              <button
                onClick={() => onToggleWishlist(product.id)}
                className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
              </button>
            </div>

            {/* View full details */}
            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="text-center text-[11px] font-bold text-gray-400 hover:text-emerald-600 transition-colors mt-1 underline underline-offset-2"
            >
              View Full Product Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
