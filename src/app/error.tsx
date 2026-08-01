"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, Home, ChevronDown, ChevronUp, LifeBuoy } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("MangoBite Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-[#fbbf24] selection:text-black overflow-x-hidden">
      <Navbar />

      {/* Ambient background glows */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-500/10 dark:bg-rose-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[140px] pointer-events-none" />

      <main className="grow flex items-center justify-center py-28 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-xl w-full text-center space-y-8 animate-fade-in bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl p-8 sm:p-12 shadow-2xl">
          
          {/* Danger Alert Icon Badge */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-rose-500/10 dark:bg-rose-500/15 flex items-center justify-center border border-rose-500/30 shadow-lg">
              <AlertTriangle className="w-12 h-12 text-rose-500" />
            </div>
          </div>
          
          {/* Text Summary */}
          <div className="space-y-3 font-sans">
            <span className="inline-block px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-widest">
              Application Exception
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif-heading font-black text-hero-text leading-tight">
              Something Went Wrong
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              We encountered an unexpected error while processing this request. Our system monitoring team has logged this event.
            </p>
          </div>

          {/* Expandable Technical Details (for Portfolio & Debugging) */}
          <div className="text-left font-sans">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-muted-bg border border-border/60 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <span>Technical Error Details</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetails && (
              <div className="mt-2 p-4 rounded-2xl bg-slate-950 text-slate-200 text-xs font-mono border border-slate-800 space-y-2 overflow-x-auto">
                <p className="text-rose-400 font-bold">{error.name}: {error.message || "Unknown error occurred"}</p>
                {error.digest && <p className="text-slate-500 text-[10px]">Digest ID: {error.digest}</p>}
                {error.stack && (
                  <pre className="text-[10px] text-slate-400 max-h-36 overflow-y-auto leading-relaxed pt-2 border-t border-slate-800">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-sans">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Again
            </button>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-muted-bg border border-border/80 hover:border-emerald-500/40 text-foreground font-bold text-xs transition-all hover:-translate-y-0.5"
            >
              <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Homepage
            </Link>

            <Link
              href="/track"
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-muted-bg border border-border/80 hover:border-amber-500/40 text-foreground font-bold text-xs transition-all hover:-translate-y-0.5"
            >
              <LifeBuoy className="w-4 h-4 text-amber-500" />
              Get Support
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
