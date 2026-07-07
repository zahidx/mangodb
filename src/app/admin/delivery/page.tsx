"use client";

import {
    ArrowUpDown,
    Clock,
    Edit2,
    Globe,
    MapPin,
    Plus,
    Search,
    Trash2,
    Truck,
    X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface DeliveryZone {
  id: string;
  area_name: string;
  division: string;
  delivery_charge: number;
  estimated_days: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminDeliveryPage() {
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"area" | "charge" | "days">("area");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentZone, setCurrentZone] = useState<DeliveryZone | null>(null);

  const [formData, setFormData] = useState({
    area_name: "",
    division: "",
    delivery_charge: 0,
    estimated_days: 3,
    is_active: true,
  });

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delivery-zones");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setZones(result.data || []);
    } catch (err: any) {
      if (!err.message?.includes('schema cache') && !err.message?.includes('Table not found')) {
        toast.error(err.message || "Failed to fetch delivery zones");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ area_name: "", division: "", delivery_charge: 0, estimated_days: 3, is_active: true });
    setCurrentZone(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.area_name.trim() || !formData.division.trim()) {
      toast.error("Area name and division are required");
      return;
    }
    try {
      const res = await fetch("/api/admin/delivery-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Delivery zone added!");
      setIsAddModalOpen(false);
      loadZones();
    } catch (err: any) {
      toast.error(err.message || "Could not add zone");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentZone) return;
    try {
      const res = await fetch("/api/admin/delivery-zones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentZone.id, ...formData }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Zone updated!");
      setIsEditModalOpen(false);
      loadZones();
    } catch (err: any) {
      toast.error(err.message || "Could not update zone");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm('Delete delivery zone "' + name + '"?')) return;
    try {
      const res = await fetch("/api/admin/delivery-zones?id=" + id, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success('"' + name + '" deleted');
      loadZones();
    } catch (err: any) {
      toast.error(err.message || "Could not delete zone");
    }
  };

  const handleToggleStatus = async (zone: DeliveryZone) => {
    try {
      const res = await fetch("/api/admin/delivery-zones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: zone.id, is_active: !zone.is_active }),
      });
      if (!res.ok) throw new Error("Update failed");
      setZones(zones.map(z => z.id === zone.id ? { ...z, is_active: !z.is_active } : z));
      toast.success("Zone " + (!zone.is_active ? "activated" : "deactivated"));
    } catch { toast.error("Failed to update"); }
  };

  const openEdit = (zone: DeliveryZone) => {
    setCurrentZone(zone);
    setFormData({
      area_name: zone.area_name,
      division: zone.division,
      delivery_charge: zone.delivery_charge,
      estimated_days: zone.estimated_days,
      is_active: zone.is_active,
    });
    setIsEditModalOpen(true);
  };

  const divisions = [...new Set(zones.map(z => z.division))].sort();

  const filteredZones = zones
    .filter(z => {
      const matchSearch = z.area_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        z.division.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDiv = divisionFilter === "all" || z.division === divisionFilter;
      return matchSearch && matchDiv;
    })
    .sort((a, b) => {
      let c = 0;
      if (sortBy === "area") c = a.area_name.localeCompare(b.area_name);
      else if (sortBy === "charge") c = a.delivery_charge - b.delivery_charge;
      else c = a.estimated_days - b.estimated_days;
      return sortOrder === "asc" ? c : -c;
    });

  const toggleSort = (t: "area" | "charge" | "days") => {
    if (sortBy === t) setSortOrder(s => s === "asc" ? "desc" : "asc");
    else { setSortBy(t); setSortOrder("asc"); }
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

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-2 shadow-sm">
              <div className="h-3 w-20 bg-slate-200 rounded"></div>
              <div className="h-8 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Filters Bar Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md p-3 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between shadow-sm">
          <div className="h-10 w-full lg:w-96 bg-slate-200 rounded-md"></div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1"></div>
            <div className="h-10 w-20 bg-slate-200 rounded-md"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-md"></div>
            <div className="h-10 w-20 bg-slate-200 rounded-md"></div>
          </div>
        </div>

        {/* Zones Table Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4"><div className="h-3 w-20 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4 flex justify-end"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-md shrink-0"></div>
                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-200 rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
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
          <h2 className="font-serif-heading text-xl sm:text-xl sm:text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <Truck className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" />
            Delivery Zone Management
          </h2>
          <p className="text-sm sm:text-xs text-[#475569] mt-1">
            Set delivery charges and estimated times for different areas across Bangladesh.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="px-4.5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Zone
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-2 shadow-sm">
          <span className="text-xs lg:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Zones</span>
          <p className="text-xl sm:text-2xl font-black text-[#0F172A]">{zones.length}</p>
        </div>
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-2 shadow-sm">
          <span className="text-xs lg:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Divisions</span>
          <p className="text-xl sm:text-2xl font-black text-[#0F172A]">{divisions.length}</p>
        </div>
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-2 shadow-sm">
          <span className="text-xs lg:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Active Zones</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600">{zones.filter(z => z.is_active).length}</p>
        </div>
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-2 shadow-sm">
          <span className="text-xs lg:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Avg Delivery Days</span>
          <p className="text-xl sm:text-2xl font-black text-[#0F172A]">
            {zones.length ? Math.round(zones.reduce((s, z) => s + z.estimated_days, 0) / zones.length) : 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-3 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by area or division..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-md border border-[#EEF2F7] bg-slate-50/50 text-sm sm:text-xs font-semibold focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-md flex-1 sm:flex-none">
            <Globe className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)}
              className="bg-transparent text-sm sm:text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer">
              <option value="all">All Divisions</option>
              {divisions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <span className="w-px h-6 bg-slate-200 hidden sm:block mx-1" />
          <button onClick={() => toggleSort("area")}
            className={"flex items-center gap-1 font-bold px-3.5 py-2.5 sm:py-2 rounded-md border transition-all cursor-pointer flex-1 sm:flex-none justify-center text-sm sm:text-xs " + (sortBy === "area" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-[#475569] border-[#EEF2F7]")}>
            Area <ArrowUpDown className="w-3.5 sm:w-3 h-3.5 sm:h-3 ml-0.5" />
          </button>
          <button onClick={() => toggleSort("charge")}
            className={"flex items-center gap-1 font-bold px-3.5 py-2.5 sm:py-2 rounded-md border transition-all cursor-pointer flex-1 sm:flex-none justify-center text-sm sm:text-xs " + (sortBy === "charge" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-[#475569] border-[#EEF2F7]")}>
            Charge <ArrowUpDown className="w-3.5 sm:w-3 h-3.5 sm:h-3 ml-0.5" />
          </button>
          <button onClick={() => toggleSort("days")}
            className={"flex items-center gap-1 font-bold px-3.5 py-2.5 sm:py-2 rounded-md border transition-all cursor-pointer flex-1 sm:flex-none justify-center text-sm sm:text-xs " + (sortBy === "days" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-[#475569] border-[#EEF2F7]")}>
            Days <ArrowUpDown className="w-3.5 sm:w-3 h-3.5 sm:h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Zones Table */}
      <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
        {filteredZones.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm">
            <Truck className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-bold">No delivery zones found</p>
            <p className="text-xs mt-1 mb-4">Add your first delivery zone to start calculating shipping costs.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Area</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Division</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Charge</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Est. Days</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F7]">
                  {filteredZones.map(zone => (
                    <tr key={zone.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-[#0F172A]">{zone.area_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs lg:text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md uppercase">{zone.division}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-emerald-600">৳ {zone.delivery_charge.toLocaleString("en-BD")}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-[#475569] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#94A3B8]" />
                          {zone.estimated_days} {zone.estimated_days === 1 ? "day" : "days"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={"text-xs lg:text-[10px] font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm " + (zone.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-50 text-slate-600 border-slate-200/50")}>
                          <span className={"w-1.5 h-1.5 rounded-sm " + (zone.is_active ? "bg-emerald-500" : "bg-slate-400")} />
                          {zone.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button onClick={() => handleToggleStatus(zone)}
                            className={"relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors shadow-inner " + (!zone.is_active ? "bg-slate-200" : "bg-emerald-500")}>
                            <span className={"pointer-events-none inline-block h-4 w-4 transform rounded-md bg-white shadow-sm transition duration-200 " + (!zone.is_active ? "translate-x-0" : "translate-x-4")} />
                          </button>
                          <button onClick={() => openEdit(zone)}
                            className="p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(zone.id, zone.area_name)}
                            className="p-2 rounded-md border border-rose-200 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-[#EEF2F7]">
              {filteredZones.map(zone => (
                <div key={zone.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-[#0F172A]">{zone.area_name}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">{zone.division}</p>
                      <span className={"mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-black uppercase " + (zone.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-50 text-slate-600 border-slate-200/50")}>
                        <span className={"w-1 h-1 rounded-sm " + (zone.is_active ? "bg-emerald-500" : "bg-slate-400")} />
                        {zone.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#94A3B8] font-semibold">Delivery Charge</span>
                      <p className="font-black text-emerald-600">৳ {zone.delivery_charge.toLocaleString("en-BD")}</p>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] font-semibold">Est. Days</span>
                      <p className="font-bold text-[#0F172A]">{zone.estimated_days} {zone.estimated_days === 1 ? "day" : "days"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button onClick={() => handleToggleStatus(zone)}
                      className={"relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors " + (!zone.is_active ? "bg-slate-200" : "bg-emerald-500")}>
                      <span className={"pointer-events-none inline-block h-5 w-5 transform rounded-md bg-white shadow-sm transition duration-200 " + (!zone.is_active ? "translate-x-0" : "translate-x-4")} />
                    </button>
                    <button onClick={() => openEdit(zone)} className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(zone.id, zone.area_name)} className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ====== ADD/EDIT MODAL ====== */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} />
          <div className="relative w-full max-w-lg bg-white border border-[#EEF2F7] rounded-md shadow-2xl overflow-hidden z-10 text-left">
            <div className="p-6 border-b border-[#EEF2F7] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[#0F172A]">
                  {isAddModalOpen ? "Add Delivery Zone" : "Edit Zone"}
                </h3>
              </div>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="p-1.5 rounded-md border border-[#EEF2F7] bg-white text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={isAddModalOpen ? handleAdd : handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs lg:text-[10px] font-black uppercase text-[#475569]">Area Name *</label>
                  <input type="text" required value={formData.area_name}
                    onChange={e => setFormData({ ...formData, area_name: e.target.value })}
                    placeholder="e.g. Gulshan"
                    className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs lg:text-[10px] font-black uppercase text-[#475569]">Division *</label>
                  <input type="text" required value={formData.division}
                    onChange={e => setFormData({ ...formData, division: e.target.value })}
                    placeholder="e.g. Dhaka"
                    className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs lg:text-[10px] font-black uppercase text-[#475569]">Delivery Charge (৳)</label>
                  <input type="number" min="0" value={formData.delivery_charge}
                    onChange={e => setFormData({ ...formData, delivery_charge: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs lg:text-[10px] font-black uppercase text-[#475569]">Est. Delivery (days)</label>
                  <input type="number" min="1" value={formData.estimated_days}
                    onChange={e => setFormData({ ...formData, estimated_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A] cursor-pointer w-fit">
                <input type="checkbox" checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                Zone is Active
              </label>
              <div className="border-t border-[#EEF2F7] pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="px-4 py-2 border border-[#EEF2F7] hover:bg-[#F8FAFC] text-[#475569] font-bold text-xs rounded-md transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-md shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  {isAddModalOpen ? "Create Zone" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
