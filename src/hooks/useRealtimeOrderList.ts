// ===========================================
// useRealtimeOrderList — Subscribe to ALL order changes via Supabase Realtime
// Used in admin panel to get live order updates without page refresh
// ===========================================
"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export function useRealtimeOrderList(initialOrders: any[] = []) {
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const supabase = createClient() as any;
  const channelRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play a subtle notification sound for new orders
  const playNewOrderSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        // Use a simple beep via Web Audio API as fallback
      }
      // Use Web Audio API for a subtle chime
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.1;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    // Subscribe to all INSERT and UPDATE events on the orders table
    const channel = supabase
      .channel("admin-orders-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload: any) => {
          const newOrder = payload.new;
          setOrders((prev) => {
            // Avoid duplicates
            if (prev.some((o) => o.id === newOrder.id)) return prev;
            toast.success(`🆕 New order #${newOrder.id?.toString().slice(0, 8)} received!`, {
              id: `new-order-${newOrder.id}`,
              duration: 6000,
            });
            playNewOrderSound();
            return [newOrder, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload: any) => {
          const updated = payload.new;
          setOrders((prev) =>
            prev.map((o) => {
              if (o.id === updated.id) {
                const oldStatus = o.status;
                // Show toast for status changes
                if (oldStatus !== updated.status) {
                  const statusLabels: Record<string, string> = {
                    confirmed: "Confirmed ✅",
                    processing: "Processing 📦",
                    shipped: "Shipped 🚚",
                    delivered: "Delivered 🎉",
                    cancelled: "Cancelled ❌",
                  };
                  const label = statusLabels[updated.status] || updated.status;
                  toast.success(
                    `Order #${updated.id?.toString().slice(0, 8)}: ${label}`,
                    { id: `order-update-${updated.id}`, duration: 4000 }
                  );
                }
                return { ...o, ...updated };
              }
              return o;
            })
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return orders;
}
