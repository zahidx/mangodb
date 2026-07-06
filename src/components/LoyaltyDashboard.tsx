// @ts-nocheck
// ===========================================
// LoyaltyDashboard — Full rewards view in user dashboard
// ===========================================
"use client";

import { useLoyaltyPoints } from "@/hooks/useLoyaltyPoints";
import { Gem, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";

const TIERS = [
  { key: "bronze", label: "Bronze", min: 0, color: "bg-amber-100 text-amber-700 border-amber-200", icon: "🥉" },
  { key: "silver", label: "Silver", min: 500, color: "bg-gray-100 text-gray-600 border-gray-200", icon: "🥈" },
  { key: "gold", label: "Gold", min: 2000, color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "🥇" },
  { key: "platinum", label: "Platinum", min: 5000, color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: "💎" },
];

export default function LoyaltyDashboard() {
  const { loyalty, transactions, loading, getTierInfo, pointsToCurrency } = useLoyaltyPoints();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!loyalty) {
    return (
      <div className="text-center py-16 bg-white dark:bg-card border border-border rounded-xl">
        <Gem className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-hero-text">No rewards yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Start shopping to earn points!</p>
        <Link href="/products" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors">
          <ShoppingBag className="w-4 h-4" />
          Shop Now
        </Link>
      </div>
    );
  }

  const tier = getTierInfo(loyalty.tier);
  const currentTierIndex = TIERS.findIndex(t => t.key === loyalty.tier);
  const nextTier = TIERS[currentTierIndex + 1];
  const progressToNext = nextTier
    ? Math.min(100, ((loyalty.lifetime_earned - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Points Overview Card */}
      <div className="bg-white dark:bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center shadow-lg">
            <Gem className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${tier.color}`}>
                {tier.icon} {tier.label}
              </span>
            </div>
            <p className="text-3xl font-black text-hero-text mt-1">{loyalty.points.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              ≈ ৳{pointsToCurrency(loyalty.points).toLocaleString()} value · {loyalty.lifetime_earned.toLocaleString()} lifetime earned
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-emerald-600">{tier.bonus}% bonus on orders</p>
          {tier.freeDelivery && <p className="text-xs text-emerald-600">Free delivery on ৳500+</p>}
        </div>
      </div>

      {/* Tier Progress */}
      <div className="bg-white dark:bg-card border border-border rounded-xl p-6">
        <h3 className="font-bold text-hero-text text-sm mb-4">Tier Progress</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{TIERS[currentTierIndex].icon} {TIERS[currentTierIndex].label}</span>
            {nextTier ? (
              <span>{nextTier.icon} {nextTier.label} ({nextTier.min - loyalty.lifetime_earned} pts away)</span>
            ) : (
              <span>💎 Max tier reached!</span>
            )}
          </div>
          <div className="h-3 bg-muted-bg rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-500 transition-all"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
        </div>

        {/* All Tiers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {TIERS.map((t, i) => {
            const isUnlocked = currentTierIndex >= i;
            return (
              <div
                key={t.key}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isUnlocked
                    ? t.key === loyalty.tier
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm"
                      : "border-border bg-card"
                    : "border-border/50 bg-muted-bg/30 opacity-50"
                }`}
              >
                <span className="text-xl block mb-1">{t.icon}</span>
                <p className="text-xs font-bold text-hero-text">{t.label}</p>
                <p className="text-[9px] text-muted-foreground">{t.min}+ pts</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How to Earn */}
      <div className="bg-white dark:bg-card border border-border rounded-xl p-6">
        <h3 className="font-bold text-hero-text text-sm mb-3">How to Earn Points</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-muted-bg rounded-lg flex items-start gap-3">
            <ShoppingBag className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-hero-text">Make a Purchase</p>
              <p className="text-muted-foreground">1 point per ৳100 spent + tier bonus</p>
            </div>
          </div>
          <div className="p-3 bg-muted-bg rounded-lg flex items-start gap-3">
            <Gem className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-hero-text">Write Reviews</p>
              <p className="text-muted-foreground">25 points per verified review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-card border border-border rounded-xl p-6">
        <h3 className="font-bold text-hero-text text-sm mb-4">Points History</h3>
        {transactions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No transactions yet. Start earning!</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-hero-text truncate">
                    {tx.transaction_type === "earned_order" && "Order placed"}
                    {tx.transaction_type === "earned_signup" && "Signup bonus"}
                    {tx.transaction_type === "earned_referral" && "Referral bonus"}
                    {tx.transaction_type === "earned_review" && "Product review"}
                    {tx.transaction_type === "spent_redemption" && "Points redeemed"}
                    {tx.transaction_type === "spent_expired" && "Points expired"}
                    {tx.transaction_type === "admin_adjustment" && "Admin adjustment"}
                    {!["earned_order", "earned_signup", "earned_referral", "earned_review", "spent_redemption", "spent_expired", "admin_adjustment"].includes(tx.transaction_type) && tx.transaction_type}
                  </p>
                  {tx.description && (
                    <p className="text-[10px] text-muted-foreground truncate">{tx.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className={`text-xs font-bold ${tx.points > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {tx.points > 0 ? "+" : ""}{tx.points}
                  </span>
                  <p className="text-[9px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
