// ===========================================
// useRealtimeOrder — Subscribe to order status changes via Supabase Realtime
// ===========================================
// Automatically listens for changes to a specific order and updates state.
// Works for both DB orders and localStorage fallback orders.
"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export function useRealtimeOrder(orderId: string | null) {
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient() as any;
  const prevStatusRef = useRef<string | null>(null);

  // Fetch order data
  const fetchOrder = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // Try Supabase first
      const { data, error: dbError } = await supabase
        .from("orders")
        .select("*, order_items:order_items(*, product:products(*))")
        .eq("id", id)
        .single();

      if (data && !dbError) {
        setOrder(data);
        prevStatusRef.current = data.status;
        setLoading(false);
        return data;
      }

      // Fallback to localStorage (guest orders)
      const stored = JSON.parse(localStorage.getItem("mangobite-orders") || "[]");
      const guestStored = JSON.parse(localStorage.getItem("mangobite-guest-orders") || "[]");
      const matched = [...stored, ...guestStored].find((o: any) => o.id === id);

      if (matched) {
        setOrder(matched);
        prevStatusRef.current = matched.status;
      } else {
        setError("Order not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!orderId) return;

    fetchOrder(orderId);

    // Subscribe to Supabase Realtime channel for this order
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          const newOrder = payload.new;
          setOrder((prev: any) => {
            const updated = { ...prev, ...newOrder };
            // Show toast when status changes
            if (prev && prev.status !== newOrder.status) {
              const statusLabels: Record<string, string> = {
                confirmed: "Order Confirmed ✅",
                processing: "Order is being processed 📦",
                shipped: "Order has been shipped 🚚",
                in_transit: "Order is in transit 🚛",
                out_for_delivery: "Out for delivery 🛵",
                delivered: "Order Delivered! 🎉",
                cancelled: "Order Cancelled ❌",
              };
              const label = statusLabels[newOrder.status] || `Status: ${newOrder.status}`;
              toast.success(label, { id: `order-status-${orderId}`, duration: 5000 });
            }
            return updated;
          });
          prevStatusRef.current = newOrder.status;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, fetchOrder]);

  const refresh = useCallback(() => {
    if (orderId) fetchOrder(orderId);
  }, [orderId, fetchOrder]);

  return { order, loading, error, refresh };
}
