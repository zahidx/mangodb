// ===========================================
// RealtimeOrderStatus — Live order status indicator
// Uses Supabase Realtime to push order updates instantly
// ===========================================
"use client";

import { useRealtimeOrder } from "@/hooks/useRealtimeOrder";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface RealtimeOrderStatusProps {
  orderId: string;
  onOrderUpdate?: (order: any) => void;
}

export default function RealtimeOrderStatus({ orderId, onOrderUpdate }: RealtimeOrderStatusProps) {
  const { order, loading, error, refresh } = useRealtimeOrder(orderId);
  const [connected, setConnected] = useState(true);
  const [showLiveBadge, setShowLiveBadge] = useState(false);

  useEffect(() => {
    if (order && !loading) {
      setShowLiveBadge(true);
      onOrderUpdate?.(order);
      const timer = setTimeout(() => setShowLiveBadge(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [order?.status, loading]);

  // Reconnection check
  useEffect(() => {
    const interval = setInterval(() => {
      setConnected(navigator.onLine);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <span className={`relative flex h-2 w-2 ${connected ? (showLiveBadge ? 'animate-ping' : '') : ''}`}>
          <span className={`absolute inline-flex h-full w-full rounded-full ${connected ? 'bg-emerald-400' : 'bg-gray-400'} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-gray-500'}`} />
        </span>
        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          {connected ? "LIVE" : "Offline"}
        </span>
      </div>

      {/* Reconnect button */}
      {!connected && (
        <button
          onClick={refresh}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          title="Reconnect"
        >
          <RefreshCw className="w-3 h-3 text-gray-400" />
        </button>
      )}
    </div>
  );
}
