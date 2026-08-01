"use client";

import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/**
 * Detects abandoned carts on return visits and prompts the user to continue.
 * Shows a single non-intrusive toast notification.
 */
export default function CartRecoveryPrompt() {
  const { cartItems } = useCart();
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    if (hasShown) return;
    
    const lastUpdate = localStorage.getItem("mangobite-cart-last-updated");
    if (!lastUpdate) return;

    const elapsed = Date.now() - new Date(lastUpdate).getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    
    // Only show if cart has items and it's been at least 30 minutes since last update
    if (cartItems.length > 0 && elapsed > thirtyMinutes) {
      const timer = setTimeout(() => {
        toast(
          (t) => (
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥭</span>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  You left something behind!
                </p>
                <p className="text-xs text-gray-500">
                  Your cart has {cartItems.length} item{cartItems.length > 1 ? "s" : ""} waiting.
                </p>
              </div>
              <button
                onClick={() => {
                  window.location.href = "/checkout";
                  toast.dismiss(t.id);
                }}
                className="ml-2 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Checkout Now
              </button>
            </div>
          ),
          { duration: 8000, id: "cart-recovery" }
        );
        setHasShown(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [cartItems, hasShown]);

  return null;
}
