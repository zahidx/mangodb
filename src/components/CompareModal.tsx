"use client";

import React, { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useCompare } from "@/context/CompareContext";
import { BarChart3, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

interface Props {
  onClose: () => void;
}

export default function CompareModal({ onClose }: Props) {
  const { compareList, removeFromCompare } = useCompare();
  const { addToCart } = useCart();

  const rows = [
    {
      label: "Image",
      render: (p: any) => (
        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-50">
          <Image src={p.images?.[0] || ""} alt={p.name} fill className="object-cover" sizes="200px" />
        </div>
      ),
    },
    {
      label: "Price",
      render: (p: any) => (
        <div className="text-center">
          <span className="text-lg font-black text-emerald-700">
            ৳ {(p.sale_price || p.price).toLocaleString("en-BD")}
          </span>
          {p.sale_price && (
            <p className="text-[11px] text-gray-400 line-through mt-0.5">৳ {p.price.toLocaleString("en-BD")}</p>
          )}
        </div>
      ),
    },
    {
      label: "Category",
      render: (p: any) => (
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
          {p.category?.name || "Uncategorized"}
        </span>
      ),
    },
    {
      label: "Description",
      render: (p: any) => (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{p.description || "—"}</p>
      ),
    },
    {
      label: "Stock",
      render: (p: any) => (
        <span className={`text-xs font-bold ${p.stock > 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
        </span>
      ),
    },
    {
      label: "Origin",
      render: (p: any) => (
        <span className="text-xs text-gray-600">{p.metadata?.origin_district || "Rajshahi"}</span>
      ),
    },
    {
      label: "Badge",
      render: (p: any) => p.metadata?.badge ? (
        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
          {p.metadata.badge}
        </span>
      ) : <span className="text-xs text-gray-400">—</span>,
    },
    {
      label: "Actions",
      render: (p: any) => (
        <div className="flex flex-col gap-2">
          <button onClick={() => { addToCart(p, 1, "10kg"); toast.success(`${p.name} added to cart!`); }}
            className="flex items-center justify-center gap-1.5 py-2 bg-[#527d62] hover:bg-[#436750] text-white rounded-md text-[10px] font-bold transition-colors cursor-pointer">
            <ShoppingBag className="w-3 h-3" /> Add to Cart
          </button>
          <Link href={`/products/${p.slug}`}
            className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-md text-[10px] font-bold transition-colors">
            View Details
          </Link>
          <button onClick={() => removeFromCompare(p.id)}
            className="text-[10px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer">
            Remove
          </button>
        </div>
      ),
    },
  ];

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div>
            <h2 id="compare-modal-title" className="text-lg font-black text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Compare Products
            </h2>
            <p className="text-[11px] text-gray-500">Comparing {compareList.length} products side by side</p>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close product comparison modal"
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>

        {/* Comparison table */}
        <div className="overflow-auto flex-1 p-6">
          <table className="w-full border-collapse">
            <tbody>
              {rows.map(row => (
                <tr key={row.label} className="border-b border-gray-50">
                  <td className="py-3 pr-6 w-28 align-top">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{row.label}</span>
                  </td>
                  {compareList.map(p => (
                    <td key={p.id} className="py-3 px-3 align-top w-1/4">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
