// ===========================================
// LoyaltyPointsBadge — Displays points & tier in navbar
// ===========================================
"use client";

import { useLoyaltyPoints } from "@/hooks/useLoyaltyPoints";
import { Gem } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoyaltyPointsBadge() {
  const { loyalty, loading, getTierInfo } = useLoyaltyPoints();
  const [open, setOpen] = useState(false);

  if (loading) return null;
  if (!loyalty) return null;

  const tier = getTierInfo(loyalty.tier);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-emerald-500 transition-all cursor-pointer text-xs font-bold"
        title={`${tier.label} — ${loyalty.points} points`}
      >
        <Gem className={`w-4 h-4 ${loyalty.tier === "platinum" ? "text-indigo-400" : loyalty.tier === "gold" ? "text-yellow-500" : loyalty.tier === "silver" ? "text-gray-400" : "text-amber-600"}`} />
        <span className="hidden sm:inline font-bold">{loyalty.points}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[240px]">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${tier.color}`}>
                  {tier.label} Tier
                </span>
                <span className="text-lg font-black text-hero-text">{loyalty.points}</span>
              </div>

              {/* Tier progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                  <span>Points</span>
                  <span>{loyalty.lifetime_earned} lifetime</span>
                </div>
                <div className="h-2 bg-muted-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all"
                    style={{
                      width: `${Math.min(100, (loyalty.lifetime_earned / 5000) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>Bronze</span>
                  <span>Silver</span>
                  <span>Gold</span>
                  <span>Platinum</span>
                </div>
              </div>

              {/* Tier benefits */}
              <div className="text-[10px] text-muted-foreground space-y-1 border-t border-border pt-2">
                <p className="font-bold text-hero-text text-[11px]">Your Benefits</p>
                {tier.bonus > 0 && <p>✦ {tier.bonus}% bonus points on every order</p>}
                {tier.freeDelivery && <p>✦ Free delivery on orders ৳500+</p>}
                <p>✦ 100 pts = ৳10 discount</p>
                <p>✦ Earn 1 pt per ৳100 spent</p>
              </div>

              <Link
                href="/dashboard?tab=loyalty"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 py-2 border-t border-border pt-2 transition-colors"
              >
                View full rewards →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
