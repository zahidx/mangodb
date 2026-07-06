"use client";

import {
    ArrowUpDown,
    Edit2,
    Filter,
    Image as ImageIcon,
    Link as LinkIcon,
    Loader2,
    Plus,
    Search,
    Trash2,
    X
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  position: "hero" | "promo" | "offer";
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const POSITIONS = ["hero", "promo", "offer"] as const;
const POSITION_LABELS: Record<string, string> = {
  hero: "Hero Slider",
  promo: "Promo Banner",
  offer: "Offer Banner",
};

export default function AdminBannersPage() {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");
  const [sortBy, setSortBy] = useState<"title" | "sort_order" | "date">("sort_order");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    position: "hero" as string,
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setBanners(result.data || []);
    } catch (err: any) {
      // Silently handle missing table — show empty state instead
      if (!err.message?.includes('schema cache') && !err.message?.includes('Table not found')) {
        console.error(err);
        toast.error("Could not load banners");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const formDataPayload = new FormData();
      formDataPayload.append("file", file);
      formDataPayload.append("bucket", "banner-images");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataPayload,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setFormData({ ...formData, image_url: result.url });
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "",
      position: "hero",
      sort_order: 0,
      is_active: true,
    });
    setCurrentBanner(null);
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.image_url.trim()) {
      toast.error("Title and Image are required");
      return;
    }

    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success("Banner added successfully!");
      setIsAddModalOpen(false);
      loadBanners();
    } catch (err: any) {
      toast.error(err.message || "Could not add banner");
    }
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBanner) return;

    try {
      const res = await fetch("/api/admin/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentBanner.id, ...formData }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success("Banner updated successfully!");
      setIsEditModalOpen(false);
      loadBanners();
    } catch (err: any) {
      toast.error(err.message || "Could not update banner");
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the banner "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success(`"${title}" has been deleted.`);
      loadBanners();
    } catch (err: any) {
      toast.error(err.message || "Could not delete banner");
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    try {
      const res = await fetch("/api/admin/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: banner.id, is_active: !banner.is_active }),
      });
      if (!res.ok) throw new Error("Update failed");

      setBanners(banners.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b));
      toast.success(`Banner ${!banner.is_active ? "activated" : "deactivated"}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const openEditModal = (banner: Banner) => {
    setCurrentBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      position: banner.position,
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    });
    setIsEditModalOpen(true);
  };

  const filteredBanners = banners
    .filter(b => {
      const matchSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPos = positionFilter === "all" ? true : b.position === positionFilter;
      const matchStatus = statusFilter === "all" ? true : statusFilter === "active" ? b.is_active : !b.is_active;
      return matchSearch && matchPos && matchStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "title") comparison = a.title.localeCompare(b.title);
      else if (sortBy === "sort_order") comparison = a.sort_order - b.sort_order;
      else if (sortBy === "date") comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (type: "title" | "sort_order" | "date") => {
    if (sortBy === type) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(type); setSortOrder("asc"); }
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

        {/* Filters Bar Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="h-10 w-full lg:w-96 bg-slate-200 rounded-md"></div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
            <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-md"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-md"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-md"></div>
          </div>
        </div>

        {/* Banners List Table Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4"><div className="h-3 w-24 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-20 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4 flex justify-end"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-14 bg-slate-200 rounded-md shrink-0"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-slate-200 rounded"></div>
                          <div className="h-3 w-48 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-200 rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 rounded-md"></div></td>
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

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] text-[#0F172A] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-indigo-500" />
            Banner Management
          </h2>
          <p className="text-xs text-[#475569] mt-1">
            Create and manage hero sliders, promo banners, and offer banners for your storefront.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="px-4.5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4 text-current" />
          Add Banner
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search banners..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#EEF2F7] bg-slate-50/50 text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3.5 py-2 rounded-md transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={positionFilter}
              onChange={e => setPositionFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Positions</option>
              {POSITIONS.map(p => (
                <option key={p} value={p}>{POSITION_LABELS[p]}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3.5 py-2 rounded-md transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <span className="w-px h-6 bg-slate-200 hidden sm:block mx-1" />

          <button onClick={() => toggleSort("sort_order")} className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-md border transition-all cursor-pointer ${sortBy === "sort_order" ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Order <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>
          <button onClick={() => toggleSort("title")} className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-md border transition-all cursor-pointer ${sortBy === "title" ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Title <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>
          <button onClick={() => toggleSort("date")} className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-md border transition-all cursor-pointer ${sortBy === "date" ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Date <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Banners List */}
      <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
        {filteredBanners.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm">
            <ImageIcon className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-bold">No banners found</p>
            <p className="text-xs text-[#94A3B8] mt-1 mb-4">Add your first banner to display on the homepage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Banner</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {filteredBanners.map(banner => (
                  <tr key={banner.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-14 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                          {banner.image_url ? (
                            <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[300px]">
                          <p className="text-sm font-extrabold text-[#0F172A] truncate">{banner.title}</p>
                          {banner.subtitle && (
                            <p className="text-[10px] text-[#64748B] truncate mt-0.5 font-medium">{banner.subtitle}</p>
                          )}
                          {banner.link_url && (
                            <div className="flex items-center gap-1 mt-1">
                              <LinkIcon className="w-3 h-3 text-indigo-400" />
                              <span className="text-[9px] text-indigo-500 truncate">{banner.link_url}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md uppercase">
                        {POSITION_LABELS[banner.position] || banner.position}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[#0F172A]">#{banner.sort_order}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm ${
                        banner.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-50 text-slate-600 border-slate-200/50"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-sm ${banner.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {banner.is_active ? "Active" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleToggleStatus(banner)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors duration-200 ease-in-out shadow-inner hover:scale-105 active:scale-95 ${
                            !banner.is_active ? "bg-slate-200 hover:bg-slate-300" : "bg-indigo-500 hover:bg-indigo-600"
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-md bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            !banner.is_active ? "translate-x-0" : "translate-x-4"
                          }`} />
                        </button>
                        <button
                          onClick={() => openEditModal(banner)}
                          className="p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner.id, banner.title)}
                          className="p-2 rounded-md border border-rose-200 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====== BANNER MODAL (Add/Edit) ====== */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} />
          <div className="relative w-full max-w-xl bg-white border border-[#EEF2F7] rounded-md shadow-2xl overflow-hidden z-10 animate-fade-in text-left flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#EEF2F7] flex items-center justify-between bg-[#F8FAFC] shrink-0">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[#0F172A]">{isAddModalOpen ? "Add New Banner" : "Edit Banner"}</h3>
                <p className="text-[10px] text-[#94A3B8]">Configure hero slider or promotional banner.</p>
              </div>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-1.5 rounded-md border border-[#EEF2F7] bg-white text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleAddBanner : handleUpdateBanner} className="p-6 overflow-y-auto space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#475569]">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Summer Mango Sale"
                  className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#475569]">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Up to 20% off on premium mangoes"
                  className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#475569]">Banner Image *</label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 text-slate-700 font-bold text-xs rounded-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {imageUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    {imageUploading ? "Uploading..." : "Upload Image"}
                  </button>
                  {formData.image_url && (
                    <span className="text-[10px] text-emerald-600 font-medium">✓ Image selected</span>
                  )}
                </div>
                {/* Preview */}
                {formData.image_url && (
                  <div className="relative mt-2 w-full h-40 rounded-md border border-slate-200 overflow-hidden bg-slate-50">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                      className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                )}
                <p className="text-[9px] text-slate-400 mt-1">Recommended: 1920x600px. Supported: JPEG, PNG, WebP. Max 5MB.</p>
              </div>

              {/* Link URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#475569]">Link URL (optional)</label>
                <input
                  type="text"
                  value={formData.link_url}
                  onChange={e => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="e.g. /products or https://..."
                  className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Position & Order */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#475569]">Position</label>
                  <select
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {POSITIONS.map(p => (
                      <option key={p} value={p}>{POSITION_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#475569]">Sort Order</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={e => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A] cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Banner is Active (Visible on homepage)
              </label>

              <div className="border-t border-[#EEF2F7] pt-4 mt-6 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="px-4 py-2 border border-[#EEF2F7] hover:bg-[#F8FAFC] text-[#475569] font-bold text-xs rounded-md transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-md shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  {isAddModalOpen ? "Create Banner" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
