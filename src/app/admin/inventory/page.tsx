"use client";

import {
    AlertTriangle,
    ArrowUpDown,
    Boxes,
    CheckCircle2,
    Filter,
    Loader2,
    Minus,
    Plus,
    Save,
    Search,
    TrendingDown,
    XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
  category?: { name: string };
  images: string[];
}

export default function AdminInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [sortBy, setSortBy] = useState<"name" | "stock">("stock");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Track modified stock levels before saving
  const [pendingAdjustments, setPendingAdjustments] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Stock history
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadStockHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/stock-history");
      const result = await res.json();
      if (res.ok) setStockHistory(result.data || []);
    } catch (_) {
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error);
      setProducts(result.data || []);
      setPendingAdjustments({});
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (id: string, newStock: number) => {
    if (newStock < 0) return;
    setPendingAdjustments(prev => ({
      ...prev,
      [id]: newStock
    }));
  };

  const handleIncrement = (id: string, currentStock: number) => {
    const value = pendingAdjustments[id] !== undefined ? pendingAdjustments[id] : currentStock;
    handleStockChange(id, value + 1);
  };

  const handleDecrement = (id: string, currentStock: number) => {
    const value = pendingAdjustments[id] !== undefined ? pendingAdjustments[id] : currentStock;
    handleStockChange(id, value - 1);
  };

  const handleSaveAdjustments = async () => {
    const idsToUpdate = Object.keys(pendingAdjustments);
    if (idsToUpdate.length === 0) return;

    setIsSaving(true);
    const toastId = toast.loading("Saving inventory changes...");

    try {
      // Update each product sequentially (or could use Promise.all)
      await Promise.all(
        idsToUpdate.map(id =>
          fetch("/api/admin/products", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, stock: pendingAdjustments[id] }),
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to update product ${id}`);
            return res.json();
          })
        )
      );

      toast.success("Inventory updated successfully!", { id: toastId });
      loadInventory(); // Reload to get fresh data
    } catch (err: any) {
      toast.error(err.message || "Could not save all adjustments", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Derived Stats
  const totalItemsInStock = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const filteredProducts = products
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const currentStock = pendingAdjustments[p.id] !== undefined ? pendingAdjustments[p.id] : p.stock;
      
      const matchStock = 
        stockFilter === "all" ? true : 
        stockFilter === "low" ? (currentStock > 0 && currentStock <= 10) : 
        (currentStock === 0);

      return matchSearch && matchStock;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "stock") {
        const aStock = pendingAdjustments[a.id] !== undefined ? pendingAdjustments[a.id] : a.stock;
        const bStock = pendingAdjustments[b.id] !== undefined ? pendingAdjustments[b.id] : b.stock;
        comparison = aStock - bStock;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (type: "name" | "stock") => {
    if (sortBy === type) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(type); setSortOrder("asc"); }
  };

  const formatCurrency = (amount: number) => `৳ ${amount.toLocaleString("en-BD")}`;
  const hasUnsavedChanges = Object.keys(pendingAdjustments).length > 0;

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-[1400px] text-[#0F172A] font-sans animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-slate-200 rounded-md mb-2"></div>
            <div className="h-4 w-64 sm:w-96 bg-slate-200 rounded-md"></div>
          </div>
        </div>

        {/* KPI Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#EEF2F7] rounded-xl p-5 sm:p-6 flex flex-col items-center text-center gap-3 sm:gap-4 shadow-sm">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-slate-200 shrink-0"></div>
              <div className="flex flex-col items-center w-full">
                <div className="h-3 w-20 bg-slate-200 rounded mb-2"></div>
                <div className="h-8 sm:h-10 w-24 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Bar Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md p-3 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between shadow-sm">
          <div className="h-10 w-full lg:w-96 bg-slate-200 rounded-md"></div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-md"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-md"></div>
          </div>
        </div>

        {/* Inventory List Card Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4"><div className="h-3 w-24 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4 flex justify-end"><div className="h-3 w-24 bg-slate-200 rounded"></div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-200 rounded-md shrink-0"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-slate-200 rounded"></div>
                          <div className="h-3 w-20 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-200 rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 rounded-md"></div></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-8 w-8 bg-slate-200 rounded-md"></div>
                        <div className="h-8 w-16 bg-slate-200 rounded-md"></div>
                        <div className="h-8 w-8 bg-slate-200 rounded-md"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] text-[#0F172A] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-xl sm:text-xl sm:text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <Boxes className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
            Inventory Tracker
          </h2>
          <p className="text-sm sm:text-xs text-[#475569] mt-1">
            Monitor stock levels and quickly adjust quantities for your warehouse.
          </p>
        </div>
        
        {hasUnsavedChanges && (
          <button
            onClick={handleSaveAdjustments}
            disabled={isSaving}
            className="w-fit self-end sm:self-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md disabled:opacity-50 disabled:pointer-events-none animate-pulse-border"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "Saving..." : "Save Adjustments"}
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EEF2F7] rounded-xl p-5 sm:p-6 flex flex-col items-center text-center gap-3 sm:gap-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.1)] transition-all duration-300">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Boxes className="w-5 sm:w-6 h-5 sm:h-6 text-slate-600" />
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1 block">Total Units</span>
            <p className="text-2xl sm:text-3xl font-black text-[#0F172A]">{totalItemsInStock.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white border border-[#EEF2F7] rounded-xl p-5 sm:p-6 flex flex-col items-center text-center gap-3 sm:gap-4 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.1)] transition-all duration-300">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" />
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1 block">Stock Value</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{formatCurrency(totalInventoryValue)}</p>
          </div>
        </div>

        <div className="bg-white border border-amber-200/60 rounded-xl p-5 sm:p-6 flex flex-col items-center text-center gap-3 sm:gap-4 shadow-[0_2px_10px_-3px_rgba(245,158,11,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(245,158,11,0.1)] transition-all duration-300 bg-amber-50/20">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 sm:w-6 h-5 sm:h-6 text-amber-600" />
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-amber-700/80 uppercase tracking-wider mb-1 block">Low Stock (≤10)</span>
            <p className="text-2xl sm:text-3xl font-black text-amber-700">{lowStockCount}</p>
          </div>
        </div>

        <div className="bg-white border border-rose-200/60 rounded-xl p-5 sm:p-6 flex flex-col items-center text-center gap-3 sm:gap-4 shadow-[0_2px_10px_-3px_rgba(225,29,72,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(225,29,72,0.1)] transition-all duration-300 bg-rose-50/20">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <XCircle className="w-5 sm:w-6 h-5 sm:h-6 text-rose-600" />
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-rose-700/80 uppercase tracking-wider mb-1 block">Out of Stock</span>
            <p className="text-2xl sm:text-3xl font-black text-rose-700">{outOfStockCount}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-3 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-md border border-[#EEF2F7] bg-slate-50/50 text-sm sm:text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-md transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 flex-1 sm:flex-none">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="bg-transparent text-sm sm:text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Inventory</option>
              <option value="low">Low Stock (≤10)</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          <span className="w-px h-6 bg-slate-200 hidden sm:block mx-1" />

          <button onClick={() => toggleSort("name")} className={`flex items-center gap-1 text-sm sm:text-xs font-bold px-3.5 py-2.5 sm:py-2 rounded-md border transition-all cursor-pointer flex-1 sm:flex-none justify-center ${sortBy === "name" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Name <ArrowUpDown className="w-3.5 sm:w-3 h-3.5 sm:h-3 ml-0.5" />
          </button>
          <button onClick={() => toggleSort("stock")} className={`flex items-center gap-1 text-sm sm:text-xs font-bold px-3.5 py-2.5 sm:py-2 rounded-md border transition-all cursor-pointer flex-1 sm:flex-none justify-center ${sortBy === "stock" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Stock <ArrowUpDown className="w-3.5 sm:w-3 h-3.5 sm:h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Inventory List Card */}
      <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm">
            <Boxes className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-bold">No items found</p>
            <p className="text-xs text-[#94A3B8] mt-1 mb-4">Try adjusting your filters to see more inventory.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Product Info</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider w-48 text-right">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F7]">
                  {filteredProducts.map((product) => {
                    const currentStock = pendingAdjustments[product.id] !== undefined 
                      ? pendingAdjustments[product.id] 
                      : product.stock;
                      
                    const isModified = pendingAdjustments[product.id] !== undefined;

                    return (
                      <tr key={product.id} className={`hover:bg-[#F8FAFC]/80 transition-colors ${isModified ? 'bg-blue-50/20' : ''}`}>
                        {/* Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Boxes className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-[#0F172A] truncate">
                                {product.name}
                              </p>
                              <p className="text-xs lg:text-[10px] text-[#64748B] font-medium">
                                {formatCurrency(product.price)} / unit
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="text-xs lg:text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md uppercase">
                            {product.category?.name || "Uncategorized"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {currentStock > 10 ? (
                            <span className="text-xs lg:text-[10px] font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm bg-emerald-50 text-emerald-700 border-emerald-200/50">
                              <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500" /> In Stock
                            </span>
                          ) : currentStock > 0 ? (
                            <span className="text-xs lg:text-[10px] font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm bg-amber-50 text-amber-700 border-amber-200/50">
                              <span className="w-1.5 h-1.5 rounded-sm bg-amber-500 animate-pulse" /> Low Stock
                            </span>
                          ) : (
                            <span className="text-xs lg:text-[10px] font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm bg-rose-50 text-rose-700 border-rose-200/50">
                              <span className="w-1.5 h-1.5 rounded-sm bg-rose-500" /> Out of Stock
                            </span>
                          )}
                        </td>

                        {/* Stock Adjuster */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleDecrement(product.id, product.stock)}
                              className="w-8 h-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-sm cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            
                            <input 
                              type="number"
                              min="0"
                              value={currentStock}
                              onChange={(e) => handleStockChange(product.id, Number(e.target.value))}
                              className={`w-16 h-8 text-center rounded-md border text-xs font-black shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                isModified 
                                  ? "border-blue-400 bg-blue-50 text-blue-700" 
                                  : "border-slate-200 bg-slate-50 text-slate-700 focus:bg-white"
                              }`}
                            />

                            <button 
                              onClick={() => handleIncrement(product.id, product.stock)}
                              className="w-8 h-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-sm cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          {isModified && (
                            <p className="text-[11px] lg:text-[9px] text-blue-600 font-bold mt-1 text-right">
                              Unsaved change (was {product.stock})
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/50">
              {filteredProducts.map((product) => {
                const currentStock = pendingAdjustments[product.id] !== undefined 
                  ? pendingAdjustments[product.id] 
                  : product.stock;
                const isModified = pendingAdjustments[product.id] !== undefined;

                return (
                  <div key={product.id} className={`rounded-xl border ${isModified ? 'border-blue-200 bg-blue-50/10' : 'border-[#EEF2F7] bg-white'} shadow-sm overflow-hidden flex flex-col transition-colors`}>
                    <div className="p-4 flex gap-4">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60 overflow-hidden shadow-inner">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Boxes className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="text-sm font-extrabold text-[#0F172A] truncate">{product.name}</p>
                          <p className="text-xs font-semibold text-[#64748B] mt-0.5">{formatCurrency(product.price)} <span className="text-[10px] font-medium text-slate-400">/ unit</span></p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase max-w-[80px] truncate">
                            {product.category?.name || "Uncategorized"}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border inline-flex items-center gap-1.5 shadow-sm ${
                            currentStock > 10 ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : 
                            currentStock > 0 ? "bg-amber-50 text-amber-700 border-amber-200/50" : 
                            "bg-rose-50 text-rose-700 border-rose-200/50"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              currentStock > 10 ? "bg-emerald-500" : 
                              currentStock > 0 ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                            }`} />
                            {currentStock > 10 ? "In Stock" : currentStock > 0 ? "Low Stock" : "Out of Stock"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock section */}
                    <div className="px-4 pb-4 mt-auto">
                      <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-bold text-slate-500 uppercase">Stock Level</span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-4">
                           <div className="flex-1">
                             <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                               <div className={`h-full rounded-full transition-all duration-500 ${
                                 currentStock > 10 ? "bg-emerald-500" : 
                                 currentStock > 0 ? "bg-amber-500" : "bg-rose-500"
                               }`} style={{ width: `${Math.min((currentStock / 100) * 100, 100)}%` }} />
                             </div>
                           </div>

                           <div className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                             <button onClick={() => handleDecrement(product.id, product.stock)}
                               className="w-7 h-7 rounded-md bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer border border-slate-200/50">
                               <Minus className="w-3 h-3" />
                             </button>
                             <input type="number" min="0" value={currentStock}
                               onChange={(e) => handleStockChange(product.id, Number(e.target.value))}
                               className={`w-12 h-7 text-center bg-transparent text-sm font-black focus:outline-none focus:ring-0 p-0 border-0 ${
                                 isModified ? "text-blue-600" : "text-[#0F172A]"
                               }`} />
                             <button onClick={() => handleIncrement(product.id, product.stock)}
                               className="w-7 h-7 rounded-md bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer border border-slate-200/50">
                               <Plus className="w-3 h-3" />
                             </button>
                           </div>
                        </div>
                      </div>
                      {isModified && (
                        <p className="text-[10px] text-blue-600 font-bold mt-2 text-right px-1 flex items-center justify-end gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Unsaved change (was {product.stock})
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      
      {/* Stock History Toggle */}
      <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
        <button
          onClick={() => {
            if (!showHistory) loadStockHistory();
            setShowHistory(!showHistory);
          }}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#F8FAFC] hover:bg-slate-100 transition-colors cursor-pointer border-b border-[#EEF2F7]"
        >
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider">Stock Change History</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] lg:text-[9px] font-bold rounded-md border border-blue-200">
              {stockHistory.length} entries
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${showHistory ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showHistory && (
          <div className="p-4">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
            ) : stockHistory.length === 0 ? (
              <div className="text-center py-8 text-[#94A3B8]">
                <TrendingDown className="w-8 h-8 mx-auto mb-2 text-[#CBD5E1]" />
                <p className="text-xs font-bold">No stock changes recorded yet</p>
                <p className="text-xs lg:text-[10px] mt-1">Changes will appear here after you adjust stock levels.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EEF2F7] bg-slate-50/50 sticky top-0">
                      <th className="px-4 py-2.5 text-[11px] lg:text-[9px] font-black uppercase text-[#475569]">Date/Time</th>
                      <th className="px-4 py-2.5 text-[11px] lg:text-[9px] font-black uppercase text-[#475569]">Product</th>
                      <th className="px-4 py-2.5 text-[11px] lg:text-[9px] font-black uppercase text-[#475569]">Change</th>
                      <th className="px-4 py-2.5 text-[11px] lg:text-[9px] font-black uppercase text-[#475569]">New Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F7] text-xs">
                    {stockHistory.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-[#F8FAFC]/60">
                        <td className="px-4 py-2.5 text-[#64748B] font-medium whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {entry.product?.images?.[0] && (
                              <img src={entry.product.images[0]} alt="" className="w-6 h-6 rounded-md object-cover" />
                            )}
                            <span className="font-semibold text-[#0F172A] truncate max-w-[180px]">
                              {entry.product?.name || "Unknown product"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-0.5 font-black ${
                            entry.change_amount > 0 ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            {entry.change_amount > 0 ? "+" : ""}{entry.change_amount}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-[#0F172A]">{entry.new_stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          70% { box-shadow: 0 0 0 4px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        .animate-pulse-border {
          animation: pulse-border 2s infinite;
        }
      `}} />
    </div>
  );
}
