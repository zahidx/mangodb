"use client";

import React, { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("mangodb-cookie-consent");
    if (!consent) {
      // Show the banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("mangodb-cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("mangodb-cookie-consent", "rejected");
    setIsVisible(false);
    // Disable GA and Meta Pixel by clearing dataLayer
    if (typeof window !== "undefined") {
      (window as any).dataLayer = [];
      (window as any).fbq = function () {};
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.1)] p-5 sm:p-6 font-sans">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-amber-500" />
          </div>

          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-extrabold text-hero-text">We value your privacy 🍪</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to improve your experience, serve personalized ads, and analyze traffic. Read our{" "}
              <Link href="/legal/privacy" className="text-emerald-600 hover:underline font-bold">Privacy Policy</Link>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleReject}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-hero-text hover:border-hero-text/20 transition-all cursor-pointer"
            >
              Reject All
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
