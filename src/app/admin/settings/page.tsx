"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Store,
  PhoneCall,
  Truck,
  Share2,
  Save,
  Loader2,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schemaError, setSchemaError] = useState(false);

  const [formData, setFormData] = useState({
    store_name: "",
    store_tagline: "",
    contact_email: "",
    contact_phone: "",
    store_address: "",
    default_delivery_charge: "0",
    free_delivery_threshold: "0",
    cod_enabled: true,
    social_facebook: "",
    social_instagram: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setSchemaError(false);
    try {
      const res = await fetch("/api/admin/settings");
      const result = await res.json();
      
      if (!res.ok) {
        if (result.error && result.error.includes("schema cache")) {
          setSchemaError(true);
          return;
        }
        throw new Error(result.error);
      }
      
      const data = result.data || {};
      
      setFormData({
        store_name: data.store_name || "",
        store_tagline: data.store_tagline || "",
        contact_email: data.contact_email || "",
        contact_phone: data.contact_phone || "",
        store_address: data.store_address || "",
        default_delivery_charge: data.default_delivery_charge?.toString() || "0",
        free_delivery_threshold: data.free_delivery_threshold?.toString() || "0",
        cod_enabled: data.cod_enabled === true || data.cod_enabled === "true",
        social_facebook: data.social_facebook || "",
        social_instagram: data.social_instagram || "",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        default_delivery_charge: Number(formData.default_delivery_charge),
        free_delivery_threshold: Number(formData.free_delivery_threshold)
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("Global settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
          <p className="text-xs font-semibold text-[#475569]">Loading global settings...</p>
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
          The site settings table has not been created yet (or your database cache needs a refresh). 
          Because we cannot run database migrations automatically from here, you must run this code in your Supabase SQL Editor.
        </p>
        <div className="space-y-2 mt-4">
          <p className="font-bold text-sm text-slate-800">Step 1: Go to <a href="https://supabase.com" target="_blank" className="text-blue-600 underline">Supabase Dashboard</a> and open the SQL Editor.</p>
          <p className="font-bold text-sm text-slate-800">Step 2: Copy and run this exact query:</p>
          <div className="relative">
            <textarea readOnly className="w-full h-80 p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-md" value={`-- 1. Create Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Set Permissions
CREATE POLICY "Site settings are viewable by everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE USING (
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

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] text-[#0F172A] font-sans mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-700" />
            Global Settings
          </h2>
          <p className="text-xs text-[#475569] mt-1">
            Manage your store's identity, contact information, and global shipping rules.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md disabled:opacity-70"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <form className="space-y-6">
        {/* Identity */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#EEF2F7] bg-[#F8FAFC] flex items-center gap-2">
            <Store className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-black text-[#0F172A]">Store Identity</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-[#475569]">Store Name *</label>
              <input type="text" name="store_name" required value={formData.store_name} onChange={handleChange} className="w-full px-3 py-2.5 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-slate-500" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-[#475569]">Store Tagline</label>
              <input type="text" name="store_tagline" value={formData.store_tagline} onChange={handleChange} placeholder="e.g. Premium Mangoes Delivered" className="w-full px-3 py-2.5 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-slate-500" />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#EEF2F7] bg-[#F8FAFC] flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-black text-[#0F172A]">Contact Information</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#475569]">Support Email *</label>
              <input type="email" name="contact_email" required value={formData.contact_email} onChange={handleChange} className="w-full px-3 py-2.5 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#475569]">Support Phone *</label>
              <input type="text" name="contact_phone" required value={formData.contact_phone} onChange={handleChange} className="w-full px-3 py-2.5 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-slate-500" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-[#475569]">Physical Address / Headquarters</label>
              <textarea rows={3} name="store_address" value={formData.store_address} onChange={handleChange} className="w-full px-3 py-2.5 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-slate-500" />
            </div>
          </div>
        </div>

        {/* Shipping & Payment Defaults */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#EEF2F7] bg-[#F8FAFC] flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-black text-[#0F172A]">Shipping & Payments</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#475569]">Default Delivery Charge (৳)</label>
              <input type="number" min="0" name="default_delivery_charge" value={formData.default_delivery_charge} onChange={handleChange} className="w-full px-3 py-2.5 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#475569]">Free Delivery Threshold (৳)</label>
              <input type="number" min="0" name="free_delivery_threshold" value={formData.free_delivery_threshold} onChange={handleChange} placeholder="0 to disable" className="w-full px-3 py-2.5 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-slate-500" />
              <p className="text-[9px] text-[#94A3B8] font-semibold mt-1">Orders above this amount get free shipping. Set to 0 to disable.</p>
            </div>
            <div className="md:col-span-2 pt-2 border-t border-[#EEF2F7]">
              <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A] cursor-pointer w-fit">
                <input type="checkbox" name="cod_enabled" checked={formData.cod_enabled} onChange={handleChange} className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                Enable Cash on Delivery (COD) across the store
              </label>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#EEF2F7] bg-[#F8FAFC] flex items-center gap-2">
            <Share2 className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-black text-[#0F172A]">Social Profiles</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#475569]">Facebook URL</label>
              <input type="url" name="social_facebook" value={formData.social_facebook} onChange={handleChange} placeholder="https://facebook.com/..." className="w-full px-3 py-2.5 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-slate-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#475569]">Instagram URL</label>
              <input type="url" name="social_instagram" value={formData.social_instagram} onChange={handleChange} placeholder="https://instagram.com/..." className="w-full px-3 py-2.5 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-slate-500" />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
