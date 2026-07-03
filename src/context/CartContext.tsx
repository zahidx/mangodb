"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, Product } from "@/types/database";
import toast from "react-hot-toast";

export interface ExtendedCartItem {
  id: string;
  product_id: string;
  quantity: number;
  selected_weight: string; // "1kg" | "2kg" | "5kg" | "10kg"
  product: Product;
}

interface CartContextType {
  cartItems: ExtendedCartItem[];
  loading: boolean;
  addToCart: (product: Product, quantity?: number, weight?: string) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  total: number;
  deliveryDistrict: string;
  setDeliveryDistrict: (district: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient() as any;
  const { profile } = useAuth();
  const [cartItems, setCartItems] = useState<ExtendedCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  // Location/Delivery state
  const [deliveryDistrict, setDeliveryDistrict] = useState<string>("Dhaka");

  // Load cart on startup / auth change
  useEffect(() => {
    async function loadCart() {
      setLoading(true);
      
      // If demo mode or anonymous or DB tables are not ready, use localStorage
      if (!profile || profile.id.startsWith("demo-")) {
        const stored = localStorage.getItem("mangodb-cart");
        if (stored) {
          try {
            setCartItems(JSON.parse(stored));
          } catch (e) {
            localStorage.removeItem("mangodb-cart");
          }
        }
        setLoading(false);
        return;
      }

      // Query from Supabase cart_items table
      try {
        const { data, error } = await supabase
          .from("cart_items")
          .select("*, product:products(*)")
          .eq("user_id", profile.id);

        if (!error && data) {
          // Format into ExtendedCartItem
          const formatted: ExtendedCartItem[] = data.map((item: any) => {
            // Retrieve weight option from product metadata if present
            const metaWeight = item.product?.metadata?.weight_options;
            const defaultWeight = Array.isArray(metaWeight) && metaWeight.length > 0 ? metaWeight[0] : "10kg";
            return {
              id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
              selected_weight: defaultWeight,
              product: item.product,
            };
          });
          setCartItems(formatted);
          localStorage.setItem("mangodb-cart", JSON.stringify(formatted));
        } else {
          // Fallback if table doesn't exist
          const stored = localStorage.getItem("mangodb-cart");
          if (stored) setCartItems(JSON.parse(stored));
        }
      } catch (err) {
        // Fallback
        const stored = localStorage.getItem("mangodb-cart");
        if (stored) setCartItems(JSON.parse(stored));
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, [profile]);

  // Save cart to local storage when it changes
  const saveLocalCart = (items: ExtendedCartItem[]) => {
    setCartItems(items);
    localStorage.setItem("mangodb-cart", JSON.stringify(items));
  };

  const addToCart = async (product: Product, quantity = 1, weight = "10kg") => {
    const existingIndex = cartItems.findIndex(
      (item) => item.product_id === product.id && item.selected_weight === weight
    );

    let updatedItems = [...cartItems];
    
    if (existingIndex > -1) {
      updatedItems[existingIndex].quantity += quantity;
    } else {
      updatedItems.push({
        id: `cart-item-${Math.random().toString(36).substr(2, 9)}`,
        product_id: product.id,
        quantity,
        selected_weight: weight,
        product,
      });
    }

    saveLocalCart(updatedItems);
    toast.success(`Added ${product.name} to cart`);

    // Sync with database if logged in and not in demo
    if (profile && !profile.id.startsWith("demo-")) {
      try {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("user_id", profile.id)
          .eq("product_id", product.id)
          .single();

        if (existing) {
          await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + quantity })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("cart_items")
            .insert({
              user_id: profile.id,
              product_id: product.id,
              quantity,
            });
        }
      } catch (e) {
        console.warn("Could not sync cart to database:", e);
      }
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    const itemToRemove = cartItems.find(item => item.id === cartItemId);
    const updatedItems = cartItems.filter((item) => item.id !== cartItemId);
    saveLocalCart(updatedItems);
    toast.success("Removed item from cart");

    // Sync database
    if (profile && !profile.id.startsWith("demo-") && itemToRemove) {
      try {
        // Find DB item matching this product
        const { data } = await supabase
          .from("cart_items")
          .select("id")
          .eq("user_id", profile.id)
          .eq("product_id", itemToRemove.product_id)
          .single();

        if (data) {
          await supabase.from("cart_items").delete().eq("id", data.id);
        }
      } catch (e) {
        console.warn("Could not remove cart item from database:", e);
      }
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    const updatedItems = cartItems.map((item) =>
      item.id === cartItemId ? { ...item, quantity } : item
    );
    saveLocalCart(updatedItems);

    const targetItem = cartItems.find((item) => item.id === cartItemId);

    // Sync database
    if (profile && !profile.id.startsWith("demo-") && targetItem) {
      try {
        const { data } = await supabase
          .from("cart_items")
          .select("id")
          .eq("user_id", profile.id)
          .eq("product_id", targetItem.product_id)
          .single();

        if (data) {
          await supabase
            .from("cart_items")
            .update({ quantity })
            .eq("id", data.id);
        }
      } catch (e) {
        console.warn("Could not update cart quantity in database:", e);
      }
    }
  };

  const clearCart = async () => {
    saveLocalCart([]);
    setAppliedCoupon(null);
    setDiscountPercent(0);

    // Sync database
    if (profile && !profile.id.startsWith("demo-")) {
      try {
        await supabase.from("cart_items").delete().eq("user_id", profile.id);
      } catch (e) {
        console.warn("Could not clear cart in database:", e);
      }
    }
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    const formattedCode = code.trim().toUpperCase();
    
    // Check local coupon mocks if database tables are not loaded
    const mockCoupons: Record<string, number> = {
      "MANGO10": 10,
      "EATFRESH": 15,
      "FREEBENGAL": 5
    };

    if (profile && !profile.id.startsWith("demo-")) {
      try {
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .eq("code", formattedCode)
          .eq("is_active", true)
          .single();

        if (!error && data) {
          setAppliedCoupon(data.code);
          setDiscountPercent(data.discount_percentage);
          toast.success(`Coupon "${data.code}" applied! (${data.discount_percentage}% off)`);
          return true;
        }
      } catch (e) {
        console.warn("Error checking coupon from DB, using fallback");
      }
    }

    // Fallback/Local checks
    if (formattedCode in mockCoupons) {
      setAppliedCoupon(formattedCode);
      setDiscountPercent(mockCoupons[formattedCode]);
      toast.success(`Coupon "${formattedCode}" applied! (${mockCoupons[formattedCode]}% off)`);
      return true;
    }

    toast.error("Invalid or expired coupon code");
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountPercent(0);
    toast.success("Coupon removed");
  };

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product.sale_price || item.product.price;
    // Scale price by weight option if necessary
    let multiplier = 1;
    if (item.selected_weight === "5kg") multiplier = 0.55;
    else if (item.selected_weight === "2kg") multiplier = 0.25;
    else if (item.selected_weight === "1kg") multiplier = 0.13;
    
    return acc + Math.round(price * multiplier) * item.quantity;
  }, 0);

  // Delivery pricing: Dhaka is 120, Outside Dhaka is 200
  const isInsideDhaka = deliveryDistrict.toLowerCase().includes("dhaka");
  const deliveryCharge = cartItems.length > 0 ? (isInsideDhaka ? 120 : 200) : 0;

  const discount = Math.round(subtotal * (discountPercent / 100));
  const total = subtotal - discount + deliveryCharge;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryCharge,
        discount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        total,
        deliveryDistrict,
        setDeliveryDistrict,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
