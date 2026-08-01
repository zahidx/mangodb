// ===========================================
// useLoyaltyPoints — Manage loyalty points, tiers, and transactions
// ===========================================
"use client";

import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useState } from "react";

interface LoyaltyData {
  points: number;
  lifetime_earned: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

interface Transaction {
  id: string;
  points: number;
  transaction_type: string;
  description: string | null;
  reference_id: string | null;
  balance_after: number;
  created_at: string;
}

const TIER_INFO = {
  bronze: { label: "Bronze", color: "text-amber-700 bg-amber-100", min: 0, bonus: 0, freeDelivery: false },
  silver: { label: "Silver", color: "text-gray-600 bg-gray-100", min: 500, bonus: 5, freeDelivery: true },
  gold: { label: "Gold", color: "text-yellow-700 bg-yellow-100", min: 2000, bonus: 10, freeDelivery: true },
  platinum: { label: "Platinum", color: "text-indigo-700 bg-indigo-100", min: 5000, bonus: 15, freeDelivery: true },
};

export function useLoyaltyPoints() {
  const { profile } = useAuth();
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPoints = useCallback(async () => {
    if (!profile || profile.id.startsWith("demo-")) {
      // Demo mode: use localStorage
      const stored = localStorage.getItem("mangobite-loyalty");
      if (stored) {
        setLoyalty(JSON.parse(stored));
      } else {
        setLoyalty({ points: 50, lifetime_earned: 50, tier: "bronze" });
      }
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty?user_id=${profile.id}`);
      const json = await res.json();
      if (res.ok) {
        setLoyalty(json.points);
        setTransactions(json.transactions || []);
      }
    } catch (err) {
      console.warn("Failed to fetch loyalty points");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const earnPoints = useCallback(
    async (points: number, type: string, description?: string, referenceId?: string) => {
      if (!profile || profile.id.startsWith("demo-")) {
        const stored = localStorage.getItem("mangobite-loyalty");
        const current = stored ? JSON.parse(stored) : { points: 0, lifetime_earned: 0, tier: "bronze" };
        const newLifetime = current.lifetime_earned + points;
        const tier = (newLifetime >= 5000 ? "platinum" : newLifetime >= 2000 ? "gold" : newLifetime >= 500 ? "silver" : "bronze") as LoyaltyData["tier"];
        const updated: LoyaltyData = { points: current.points + points, lifetime_earned: newLifetime, tier };
        localStorage.setItem("mangobite-loyalty", JSON.stringify(updated));
        setLoyalty(updated);
        return;
      }

      try {
        const res = await fetch("/api/loyalty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: profile.id, points, transaction_type: type, description, reference_id: referenceId }),
        });
        const json = await res.json();
        if (res.ok) {
          setLoyalty(json.data);
          fetchPoints();
        }
      } catch (err) {
        console.warn("Failed to earn points");
      }
    },
    [profile, fetchPoints]
  );

  const getTierInfo = useCallback((tier: string) => {
    return TIER_INFO[tier as keyof typeof TIER_INFO] || TIER_INFO.bronze;
  }, []);

  const canRedeem = useCallback(
    (pointsRequired: number) => {
      return (loyalty?.points || 0) >= pointsRequired;
    },
    [loyalty]
  );

  const pointsToCurrency = useCallback((pts: number) => {
    return Math.floor(pts / 100) * 10; // 100 pts = ৳10
  }, []);

  return {
    loyalty,
    transactions,
    loading,
    earnPoints,
    fetchPoints,
    getTierInfo,
    canRedeem,
    pointsToCurrency,
  };
}
