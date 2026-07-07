"use client";

import React, { useState, useEffect } from "react";
import {
  MonitorPlay,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  GripVertical,
  ArrowUpRight,
  Monitor,
  AlertCircle
} from "lucide-react";
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
}

export default function AdminContentPage() {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    position: "hero",
    sort_order: "0",
    is_active: true,
  });

  const [schemaError, setSchemaError] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    setSchemaError(false);
    try {
      const res = await fetch("/api/admin/banners");
      const result = await res.json();
      
      if (!res.ok) {
        if (result.error && result.error.includes("schema cache")) {
          setSchemaError(true);
          return;
        }
        throw new Error(result.error);
      }
      setBanners(result.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "",
      position: "hero",
      sort_order: "0",
      is_active: true,
    });
    setCurrentBanner(null);
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.image_url) {
      toast.error("Title and Image URL are required");
      return;
    }

    const payload = {
      title: formData.title,
      subtitle: formData.subtitle || null,
      image_url: formData.image_url,
      link_url: formData.link_url || null,
      position: formData.position,
      sort_order: parseInt(formData.sort_order) || 0,
      is_active: formData.is_active,
    };

    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("Banner published successfully!");
      setIsAddModalOpen(false);
      loadBanners();
    } catch (err: any) {
      toast.error(err.message || "Could not publish banner");
    }
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBanner) return;

    const payload = {
      id: currentBanner.id,
      title: formData.title,
      subtitle: formData.subtitle || null,
      image_url: formData.image_url,
      link_url: formData.link_url || null,
      position: formData.position,
      sort_order: parseInt(formData.sort_order) || 0,
      is_active: formData.is_active,
    };

    try {
      const res = await fetch("/api/admin/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    if (!window.confirm(`Are you sure you want to delete banner "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success(`Banner deleted.`);
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
      toast.success(`Banner ${!banner.is_active ? 'activated' : 'hidden'}`);
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
      sort_order: banner.sort_order.toString(),
      is_active: banner.is_active,
    });
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-fuchsia-600 animate-spin" />
          <p className="text-xs font-semibold text-[#475569]">Loading content...</p>
        </div>
      </div>
    );
  }

  if (schemaError) {
    return (
      <div className="flex flex-col gap-4 p-8 max-w-4xl mx-auto mt-10 bg-rose-50 border-2 border-rose-200 rounded-md">
        <h2 className="text-2xl font-black text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-8 h-8" /> Database Setup Required!
        </h2>
        <p className="text-sm font-semibold text-rose-900">
          The banners table has not been created yet (or your database cache needs a refresh). 
          Because we cannot run database migrations automatically from here, you must run this code in your Supabase SQL Editor.
        </p>
        <div className="space-y-2 mt-4">
          <p className="font-bold text-sm text-slate-800">Step 1: Go to <a href="https://supabase.com" target="_blank" className="text-blue-600 underline">Supabase Dashboard</a> and open the SQL Editor.</p>
          <p className="font-bold text-sm text-slate-800">Step 2: Copy and run this exact query:</p>
          <div className="relative">
            <textarea readOnly className="w-full h-80 p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-md" value={`-- 1. Create Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'hero' CHECK (position IN ('hero', 'promo', 'offer')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Security
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 3. Set Permissions
CREATE POLICY "Banners are viewable by everyone" ON public.banners FOR SELECT USING (true);

CREATE POLICY "Admins can insert banners" ON public.banners FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update banners" ON public.banners FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete banners" ON public.banners FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. FORCE REFRESH THE API CACHE (This fixes your error!)
NOTIFY pgrst, 'reload schema';`} />
          </div>
          <p className="font-bold text-sm text-slate-800 mt-4">Step 3: Once you run it in Supabase, refresh this page!</p>
        </div>
      </div>
    );
  }

  const heroBanners = banners.filter(b => b.position === 'hero');
  const promoBanners = banners.filter(b => b.position === 'promo' || b.position === 'offer');

  const renderBannerList = (list: Banner[], title: string, subtitle: string) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-black text-[#0F172A]">{title}</h3>
          <p className="text-[10px] text-[#64748B]">{subtitle} ({list.length} blocks)</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-[#EEF2F7] border-dashed rounded-md p-10 text-center shadow-sm">
          <Monitor className="w-8 h-8 mx-auto text-[#CBD5E1] mb-2" />
          <p className="text-xs font-bold text-[#64748B]">No {title.toLowerCase()} found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(banner => (
            <div key={banner.id} className={`bg-white border rounded-md shadow-sm overflow-hidden flex flex-col transition-all ${!banner.is_active ? 'border-[#EEF2F7] opacity-60' : 'border-fuchsia-200/50 hover:border-fuchsia-300'}`}>
              <div className="aspect-video bg-slate-100 relative group overflow-hidden border-b border-[#EEF2F7]">
                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => openEditModal(banner)} className="w-8 h-8 rounded-md bg-white text-slate-900 flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteBanner(banner.id, banner.title)} className="w-8 h-8 rounded-md bg-rose-600 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {!banner.is_active && (
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur text-white text-[9px] font-black uppercase px-2 py-1 rounded-md">
                    Hidden
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-slate-900 text-[9px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                  <GripVertical className="w-3 h-3" /> Order: {banner.sort_order}
                </div>
              </div>
              <div className="p-4 flex flex-col flex-grow bg-white">
                <h4 className="text-sm font-black text-[#0F172A] truncate">{banner.title}</h4>
                <p className="text-xs text-[#64748B] truncate mt-0.5">{banner.subtitle || "No subtitle"}</p>
                
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <button 
                    onClick={() => handleToggleStatus(banner)}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase"
                  >
                    {banner.is_active ? (
                      <span className="text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100"><CheckCircle2 className="w-3 h-3" /> Visible</span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-200"><XCircle className="w-3 h-3" /> Hidden</span>
                    )}
                  </button>
                  
                  {banner.link_url && (
                    <a href={banner.link_url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-1 transition-colors bg-fuchsia-50 px-2 py-1 rounded-md">
                      Link <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] text-[#0F172A] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <MonitorPlay className="w-6 h-6 text-fuchsia-600" />
            Content Management
          </h2>
          <p className="text-xs text-[#475569] mt-1">
            Design your storefront, manage homepage hero banners, and promotional slides.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="w-fit self-end sm:self-auto px-4.5 py-2.5 bg-slate-900 hover:bg-fuchsia-600 text-white font-black text-xs uppercase tracking-wider rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4 text-current" />
          Add Content Block
        </button>
      </div>

      <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm p-6">
        {renderBannerList(heroBanners, "Homepage Hero Banners", "Large sliders at the very top of the store")}
        <div className="w-full h-px bg-[#EEF2F7] my-8" />
        {renderBannerList(promoBanners, "Promotional & Offer Blocks", "Smaller banners used across the site")}
      </div>

      {/* ====== CONTENT MODAL ====== */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} />
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-md shadow-2xl overflow-hidden z-10 flex flex-col text-left font-sans text-slate-800 animate-modal-enter">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-serif-heading text-lg font-black text-slate-900 leading-tight">
                  {isAddModalOpen ? "New Content Block" : "Edit Content Block"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Configure visual elements for the storefront.</p>
              </div>
              <button
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="w-8 h-8 rounded-full border border-slate-200/60 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleAddBanner : handleUpdateBanner} className="p-6 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Headline / Title *</label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Summer Mango Festival" className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-bold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all duration-200" />
                </div>
                
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Subtitle</label>
                  <input type="text" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} placeholder="e.g. Get 20% off all Fazli mangoes" className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all duration-200" />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Image URL *</label>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                      {formData.image_url ? (
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <input type="url" required value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all duration-200 flex-grow" />
                  </div>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Target Link URL (Optional)</label>
                  <input type="url" value={formData.link_url} onChange={(e) => setFormData({...formData, link_url: e.target.value})} placeholder="/collections/summer-sale" className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all duration-200" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Placement Area</label>
                  <select value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value as any})} className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all duration-200 cursor-pointer">
                    <option value="hero">Homepage Hero Slider</option>
                    <option value="promo">Promo Banner</option>
                    <option value="offer">Offer Strip</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Sort Order</label>
                  <input type="number" value={formData.sort_order} onChange={(e) => setFormData({...formData, sort_order: e.target.value})} placeholder="0" className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 transition-all duration-200" />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none mt-2 pt-3 border-t border-slate-100 w-fit">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 rounded border-slate-350 text-fuchsia-600 focus:ring-fuchsia-500/20 cursor-pointer" />
                <span>Publish this block (Visible on storefront)</span>
              </label>

              <div className="border-t border-slate-100 pt-5 mt-6 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 font-black text-xs uppercase tracking-wider rounded-md transition-all duration-200 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-fuchsia-600 text-white font-black text-xs uppercase tracking-wider rounded-md shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer">
                  {isAddModalOpen ? "Save Content" : "Update Content"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
