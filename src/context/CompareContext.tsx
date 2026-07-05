"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import toast from "react-hot-toast";

export interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  description: string | null;
  images: string[];
  category?: { name: string } | null;
  stock: number;
  metadata?: Record<string, any> | null;
}

interface CompareContextType {
  compareList: CompareProduct[];
  addToCompare: (product: CompareProduct) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | null>(null);

const MAX_COMPARE = 4;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<CompareProduct[]>([]);

  const addToCompare = useCallback((product: CompareProduct) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      if (prev.length >= MAX_COMPARE) {
        toast.error(`You can compare up to ${MAX_COMPARE} products`);
        return prev;
      }
      toast.success(`${product.name} added to compare`);
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareList(prev => {
      const p = prev.find(x => x.id === productId);
      if (p) toast.success(`${p.name} removed from compare`);
      return prev.filter(p => p.id !== productId);
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  const isInCompare = useCallback((productId: string) => {
    return compareList.some(p => p.id === productId);
  }, [compareList]);

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
