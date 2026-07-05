"use client";

import { RefreshCw, ShoppingBag, WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <WifiOff className="h-10 w-10 text-amber-600" />
        </div>

        {/* Heading */}
        <h1 className="mb-3 font-serif text-3xl font-bold text-gray-900">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="mb-6 text-gray-600 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry —
          some of your favourite products may still be available from the cache.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>

          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Link>
        </div>

        {/* Browsed pages note */}
        <p className="mt-8 text-xs text-gray-400">
          Pages you&apos;ve visited recently may still be available in the cache.
        </p>
      </div>
    </div>
  );
}
