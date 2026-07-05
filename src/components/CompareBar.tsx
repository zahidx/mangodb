"use client";

import { useCompare } from "@/context/CompareContext";
import { BarChart3, X } from "lucide-react";
import { useState } from "react";
import CompareModal from "./CompareModal";

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const [showModal, setShowModal] = useState(false);

  if (compareList.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Product thumbnails */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {compareList.map(p => (
              <div key={p.id} className="relative group flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <div className="w-8 h-8 rounded overflow-hidden bg-white shrink-0">
                  <img src={p.images?.[0] || ""} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{p.name}</span>
                <button onClick={() => removeFromCompare(p.id)}
                  className="p-0.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer shrink-0">
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={clearCompare}
              className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
              Clear All
            </button>
            <button onClick={() => setShowModal(true)}
              disabled={compareList.length < 2}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm">
              <BarChart3 className="w-3.5 h-3.5" />
              Compare ({compareList.length})
            </button>
          </div>
        </div>
      </div>

      {showModal && <CompareModal onClose={() => setShowModal(false)} />}
    </>
  );
}
