"use client";

import React, { useState, useEffect } from "react";
import {
  Ticket,
  Search,
  Plus,
  Edit2,
  Trash2,
  Percent,
  CalendarX,
  CheckCircle2,
  Filter,
  Loader2,
  ArrowUpDown,
  X,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  is_active: boolean;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  created_at: string;
}

export default function AdminCouponsPage() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "disabled">("all");
  const [sortBy, setSortBy] = useState<"date" | "usage">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Coupon | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    expires_at: "",
    is_active: true,
  });

  const [schemaError, setSchemaError] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    setSchemaError(false);
    try {
      const res = await fetch("/api/admin/coupons");
      const result = await res.json();
      
      if (!res.ok) {
        if (result.error && result.error.includes("schema cache")) {
          setSchemaError(true);
          return;
        }
        throw new Error(result.error);
      }
      setCoupons(result.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString).getTime() < new Date().getTime();
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      min_order_amount: "",
      max_discount_amount: "",
      usage_limit: "",
      expires_at: "",
      is_active: true,
    });
    setCurrentCoupon(null);
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    const payload = {
      code: formData.code,
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value),
      min_order_amount: formData.min_order_amount ? Number(formData.min_order_amount) : 0,
      max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : null,
      usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      is_active: formData.is_active,
    };

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("Coupon created successfully!");
      setIsAddModalOpen(false);
      loadCoupons();
    } catch (err: any) {
      toast.error(err.message || "Could not create coupon");
    }
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCoupon) return;

    const payload = {
      id: currentCoupon.id,
      code: formData.code,
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value),
      min_order_amount: formData.min_order_amount ? Number(formData.min_order_amount) : 0,
      max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : null,
      usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      is_active: formData.is_active,
    };

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("Coupon updated successfully!");
      setIsEditModalOpen(false);
      loadCoupons();
    } catch (err: any) {
      toast.error(err.message || "Could not update coupon");
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success(`${code} has been deleted.`);
      loadCoupons();
    } catch (err: any) {
      toast.error(err.message || "Could not delete coupon");
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
      });
      if (!res.ok) throw new Error("Update failed");
      
      setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
      toast.success(`Coupon ${!coupon.is_active ? 'activated' : 'disabled'}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const openEditModal = (coupon: Coupon) => {
    setCurrentCoupon(coupon);
    
    // Format date for datetime-local input
    let formattedDate = "";
    if (coupon.expires_at) {
      const d = new Date(coupon.expires_at);
      formattedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount > 0 ? coupon.min_order_amount.toString() : "",
      max_discount_amount: coupon.max_discount_amount ? coupon.max_discount_amount.toString() : "",
      usage_limit: coupon.usage_limit ? coupon.usage_limit.toString() : "",
      expires_at: formattedDate,
      is_active: coupon.is_active,
    });
    setIsEditModalOpen(true);
  };

  // Derived Stats
  const activeCount = coupons.filter(c => c.is_active && !isExpired(c.expires_at)).length;
  const expiredCount = coupons.filter(c => isExpired(c.expires_at)).length;
  const totalUsages = coupons.reduce((acc, c) => acc + c.used_count, 0);

  const filteredCoupons = coupons
    .filter((c) => {
      const searchMatch = searchQuery === "" || c.code.toLowerCase().includes(searchQuery.toLowerCase());

      const statusMatch = statusFilter === "all" ? true :
        statusFilter === "active" ? (c.is_active && !isExpired(c.expires_at)) :
        statusFilter === "disabled" ? !c.is_active :
        isExpired(c.expires_at);

      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "usage") {
        comparison = a.used_count - b.used_count;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (type: "date" | "usage") => {
    if (sortBy === type) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(type); setSortOrder("desc"); }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-[1400px] text-[#0F172A] font-sans animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-slate-200 rounded-md mb-2"></div>
            <div className="h-4 w-64 sm:w-96 bg-slate-200 rounded-md"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-md shrink-0"></div>
        </div>

        {/* KPI Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-slate-200 rounded"></div>
                <div className="w-8 h-8 rounded-md bg-slate-200"></div>
              </div>
              <div className="h-8 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Filters Bar Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="h-10 w-full lg:w-96 bg-slate-200 rounded-md"></div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-md"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-md"></div>
          </div>
        </div>

        {/* Coupons Table Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4"><div className="h-3 w-24 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-20 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-32 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4 flex justify-end"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="h-6 w-24 bg-slate-200 rounded-md"></div>
                        <div className="h-3 w-24 bg-slate-200 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="h-4 w-16 bg-slate-200 rounded"></div>
                        <div className="h-3 w-24 bg-slate-200 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-slate-200 rounded-full"></div>
                          <div className="h-3 w-16 bg-slate-200 rounded"></div>
                        </div>
                        <div className="h-3 w-24 bg-slate-200 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-200 rounded-md"></div></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="h-5 w-9 bg-slate-200 rounded-md"></div>
                        <div className="h-8 w-8 bg-slate-200 rounded-md"></div>
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

  if (schemaError) {
    return (
      <div className="flex flex-col gap-4 p-8 max-w-4xl mx-auto mt-10 bg-rose-50 border-2 border-rose-200 rounded-lg">
        <h2 className="text-2xl font-black text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-8 h-8" /> Database Setup Required!
        </h2>
        <p className="text-sm font-semibold text-rose-900">
          The coupons table has not been created yet (or your database cache needs a refresh). 
          Because we cannot run database migrations automatically from here, you must run this code in your Supabase SQL Editor.
        </p>
        <div className="space-y-2 mt-4">
          <p className="font-bold text-sm text-slate-800">Step 1: Go to <a href="https://supabase.com" target="_blank" className="text-blue-600 underline">Supabase Dashboard</a> and open the SQL Editor.</p>
          <p className="font-bold text-sm text-slate-800">Step 2: Copy and run this exact query:</p>
          <div className="relative">
            <textarea readOnly className="w-full h-80 p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-md" value={`-- Drop any conflicting old table
DROP TABLE IF EXISTS public.coupons CASCADE;

-- Create the correct coupons table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active coupons
CREATE POLICY "Allow public read access to active coupons" ON public.coupons
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Allow admin full access
CREATE POLICY "Allow admin full access to coupons" ON public.coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Refresh the API Cache
NOTIFY pgrst, 'reload schema';`} />
          </div>
          <p className="font-bold text-sm text-slate-800 mt-4">Step 3: Once you run it in Supabase, refresh this page!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] text-[#0F172A] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <Ticket className="w-6 h-6 text-pink-600" />
            Coupons & Promotions
          </h2>
          <p className="text-xs text-[#475569] mt-1">
            Create discount codes, set usage limits, and run promotional campaigns.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="px-4.5 py-2.5 bg-slate-900 hover:bg-pink-600 text-white font-black text-xs uppercase tracking-wider rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4 text-current" />
          Create Coupon
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-pink-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Active Campaigns</span>
            <div className="w-8 h-8 rounded-md bg-pink-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-pink-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{activeCount}</p>
        </div>

        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Usages</span>
            <div className="w-8 h-8 rounded-md bg-purple-50 flex items-center justify-center">
              <Percent className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{totalUsages}</p>
        </div>

        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Expired Codes</span>
            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
              <CalendarX className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{expiredCount}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coupon codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#EEF2F7] bg-slate-50/50 text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all uppercase"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3.5 py-2 rounded-md transition-all focus-within:border-pink-500 focus-within:ring-4 focus-within:ring-pink-500/10">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Coupons</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <span className="w-px h-6 bg-slate-200 hidden sm:block mx-1" />

          <button onClick={() => toggleSort("date")} className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-md border transition-all cursor-pointer ${sortBy === "date" ? "bg-pink-600 text-white border-pink-600" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Date <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>
          <button onClick={() => toggleSort("usage")} className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-md border transition-all cursor-pointer ${sortBy === "usage" ? "bg-pink-600 text-white border-pink-600" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Usage <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
        {filteredCoupons.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm">
            <Ticket className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-bold">No coupons found</p>
            <p className="text-xs text-[#94A3B8] mt-1 mb-4">Try adjusting your filters or create a new coupon.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Coupon Code</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Usage & Limits</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {filteredCoupons.map((coupon) => {
                  const expired = isExpired(coupon.expires_at);
                  const limitReached = coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit;

                  return (
                    <tr key={coupon.id} className={`hover:bg-[#F8FAFC]/80 transition-colors ${(expired || !coupon.is_active) ? 'opacity-70' : ''}`}>
                      {/* Code */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#0F172A] uppercase tracking-wide bg-slate-100 px-2 py-1 rounded-md w-fit border border-slate-200">
                            {coupon.code}
                          </span>
                          <span className="text-[10px] text-[#94A3B8] mt-1">
                            Created: {new Date(coupon.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Discount Details */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-pink-600">
                            {coupon.discount_type === "percentage" ? `${coupon.discount_value}% OFF` : `৳${coupon.discount_value} OFF`}
                          </span>
                          {coupon.min_order_amount > 0 && (
                            <span className="text-[10px] text-[#64748B] font-medium mt-1">
                              Min Order: ৳{coupon.min_order_amount}
                            </span>
                          )}
                          {coupon.max_discount_amount && (
                            <span className="text-[10px] text-[#64748B] font-medium">
                              Max Discount: ৳{coupon.max_discount_amount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-24">
                              <div 
                                className={`h-full ${limitReached ? 'bg-rose-500' : 'bg-pink-500'}`} 
                                style={{ width: coupon.usage_limit ? `${Math.min(100, (coupon.used_count / coupon.usage_limit) * 100)}%` : '0%' }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-[#475569]">
                              {coupon.used_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : 'used'}
                            </span>
                          </div>
                          {coupon.expires_at && (
                            <span className={`text-[10px] font-medium flex items-center gap-1 ${expired ? 'text-rose-600' : 'text-[#64748B]'}`}>
                              <CalendarX className="w-3 h-3" />
                              {expired ? "Expired " : "Ends "}
                              {new Date(coupon.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm ${
                          !coupon.is_active ? "bg-slate-50 text-slate-600 border-slate-200/50" : 
                          expired ? "bg-rose-50 text-rose-700 border-rose-200/50" :
                          "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-sm ${!coupon.is_active ? "bg-slate-400" : expired ? "bg-rose-500" : "bg-emerald-500"}`} />
                          {!coupon.is_active ? "Disabled" : expired ? "Expired" : "Active"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleToggleStatus(coupon)}
                            title={coupon.is_active ? "Disable Coupon" : "Enable Coupon"}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner hover:scale-105 active:scale-95 ${
                              !coupon.is_active ? "bg-slate-200 hover:bg-slate-300" : "bg-emerald-500 hover:bg-emerald-600"
                            }`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-md bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              !coupon.is_active ? "translate-x-0" : "translate-x-4"
                            }`} />
                          </button>
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                            className="p-2 rounded-md border border-rose-200 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====== COUPON MODAL ====== */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} />
          <div className="relative w-full max-w-2xl bg-white border border-[#EEF2F7] rounded-md shadow-2xl overflow-hidden z-10 animate-fade-in text-left flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#EEF2F7] flex items-center justify-between bg-[#F8FAFC] shrink-0">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[#0F172A]">{isAddModalOpen ? "Create Coupon Code" : "Edit Coupon"}</h3>
                <p className="text-[10px] text-[#94A3B8]">Configure discount rules and usage limits.</p>
              </div>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-1.5 rounded-md border border-[#EEF2F7] bg-white text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleAddCoupon : handleUpdateCoupon} className="p-6 overflow-y-auto space-y-6">
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#0F172A] border-b pb-2">Core Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#475569]">Coupon Code *</label>
                    <input type="text" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '')})} placeholder="e.g. MANGOLOVE" className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-black uppercase focus:outline-none focus:border-pink-500" />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A] cursor-pointer">
                      <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="rounded border-slate-300 text-pink-600 focus:ring-pink-500" />
                      Status: Active
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#0F172A] border-b pb-2">Discount Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#475569]">Discount Type *</label>
                    <select value={formData.discount_type} onChange={(e) => setFormData({...formData, discount_type: e.target.value as any})} className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-bold focus:outline-none focus:border-pink-500 cursor-pointer">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (৳)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#475569]">Discount Value *</label>
                    <input type="number" required min="0" step={formData.discount_type === 'percentage' ? "1" : "0.01"} max={formData.discount_type === 'percentage' ? "100" : undefined} value={formData.discount_value} onChange={(e) => setFormData({...formData, discount_value: e.target.value})} className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-pink-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#475569]">Min Order Amount (৳)</label>
                    <input type="number" min="0" step="0.01" value={formData.min_order_amount} onChange={(e) => setFormData({...formData, min_order_amount: e.target.value})} placeholder="0 for no minimum" className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-pink-500" />
                  </div>
                  {formData.discount_type === 'percentage' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[#475569]">Max Discount Cap (৳)</label>
                      <input type="number" min="0" step="0.01" value={formData.max_discount_amount} onChange={(e) => setFormData({...formData, max_discount_amount: e.target.value})} placeholder="Optional cap" className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-pink-500" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#0F172A] border-b pb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Limits & Expiration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#475569]">Total Usage Limit</label>
                    <input type="number" min="1" value={formData.usage_limit} onChange={(e) => setFormData({...formData, usage_limit: e.target.value})} placeholder="Leave blank for unlimited" className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-pink-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-[#475569]">Expiration Date & Time</label>
                    <input type="datetime-local" value={formData.expires_at} onChange={(e) => setFormData({...formData, expires_at: e.target.value})} className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-pink-500" />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#EEF2F7] pt-4 mt-6 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 border border-[#EEF2F7] hover:bg-[#F8FAFC] text-[#475569] font-bold text-xs rounded-md transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs rounded-md shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  {isAddModalOpen ? "Publish Coupon" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
