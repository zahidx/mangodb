"use client";

import { Check, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

interface AddToCartToastProps {
  productName: string;
  productImage?: string;
  quantity: number;
  weight: string;
}

export function showAddToCartToast({
  productName,
  productImage,
  quantity,
  weight,
}: AddToCartToastProps) {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } pointer-events-auto flex w-full max-w-sm rounded-lg border border-emerald-500/20 bg-gradient-to-br from-[#0D2319] to-[#0F2A1E] shadow-[0_20px_60px_rgba(0,0,0,0.4)] ring-1 ring-white/10`}
      >
        <div className="flex w-full items-center gap-3 p-3.5">
          {/* Product image thumbnail */}
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-white/10 bg-emerald-900/30">
            {productImage ? (
              <Image
                src={productImage}
                alt={productName}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl">🥭</div>
            )}
            {/* Green check badge */}
            <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0D2319]">
              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="inline-block w-fit rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 leading-none">
              Added to Cart
            </span>
            <p className="truncate text-sm font-bold text-white leading-tight pt-0.5">{productName}</p>
            <p className="text-[11px] text-emerald-200/60 leading-tight">
              {quantity} × {weight}
            </p>
          </div>

          {/* Action */}
          <div className="flex shrink-0 flex-col items-center gap-1 self-stretch justify-center">
            <Link
              href="/cart"
              onClick={() => toast.dismiss(t.id)}
              className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2 text-[11px] font-extrabold text-black shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Cart
            </Link>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-[9px] font-semibold text-emerald-200/40 hover:text-emerald-200/70 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    ),
    {
      duration: 4000,
      position: "top-right",
    }
  );
}
