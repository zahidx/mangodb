// ===========================================
// useWishlist — Shared wishlist hook with server sync
// ===========================================
// Merges localStorage wishlist with Supabase wishlist for authenticated users.
// On toggle: writes to both localStorage (instant) and server (persistent).
// On login: fetches server wishlist and merges with local.

import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const STORAGE_KEY = "mangobite-wishlist";

export function useWishlist() {
  const { profile } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load wishlist on mount / profile change
  useEffect(() => {
    loadWishlist();
  }, [profile?.id]);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      // 1. Always load local wishlist first (instant)
      const localIds = getLocalWishlist();

      // 2. If user is logged in (not demo), fetch server wishlist and merge
      if (profile && !profile.id.startsWith("demo-")) {
        try {
          const res = await fetch(`/api/user/wishlist?user_id=${profile.id}`);
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            const serverIds = json.data.map((item: any) => item.product_id);
            // Merge: union of local and server IDs
            const merged = Array.from(new Set([...localIds, ...serverIds]));
            setWishlist(merged);
            // Persist merged list back to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            // If there were local-only items, push them to server
            const localOnly = localIds.filter((id) => !serverIds.includes(id));
            for (const pid of localOnly) {
              fetch("/api/user/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: profile.id, product_id: pid }),
              }).catch(() => {});
            }
            return;
          }
        } catch (e) {
          console.warn("Failed to sync wishlist from server, using local");
        }
      }

      // Fallback: just use local wishlist
      setWishlist(localIds);
    } finally {
      setLoading(false);
    }
  };

  const getLocalWishlist = (): string[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const persistLocal = (ids: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  };

  const toggleWishlist = useCallback(
    async (productId: string, productName?: string) => {
      const isWished = wishlist.includes(productId);
      let next: string[];

      if (isWished) {
        next = wishlist.filter((id) => id !== productId);
        toast.success(productName ? `${productName} removed from wishlist` : "Removed from wishlist");
      } else {
        next = [...wishlist, productId];
        toast.success(productName ? `${productName} added to wishlist` : "Added to wishlist");
      }

      setWishlist(next);
      persistLocal(next);

      // Sync to server if logged in
      if (profile && !profile.id.startsWith("demo-")) {
        try {
          if (isWished) {
            await fetch(`/api/user/wishlist?user_id=${profile.id}&product_id=${productId}`, {
              method: "DELETE",
            });
          } else {
            await fetch("/api/user/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: profile.id, product_id: productId }),
            });
          }
        } catch (e) {
          console.warn("Failed to sync wishlist to server");
        }
      }
    },
    [wishlist, profile]
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  const removeFromWishlist = useCallback(
    async (productId: string) => {
      const next = wishlist.filter((id) => id !== productId);
      setWishlist(next);
      persistLocal(next);

      if (profile && !profile.id.startsWith("demo-")) {
        fetch(`/api/user/wishlist?user_id=${profile.id}&product_id=${productId}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    },
    [wishlist, profile]
  );

  return {
    wishlist,
    loading,
    toggleWishlist,
    isInWishlist,
    removeFromWishlist,
  };
}
