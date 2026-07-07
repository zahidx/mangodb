"use client";

import {
    CheckCircle2,
    CornerDownLeft,
    Search,
    Undo2,
    User,
    XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "refunded";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  order?: { id: string; total: number; status: string; created_at: string };
  profile?: { full_name: string; email: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  refunded: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function AdminReturnsPage() {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { loadReturns(); }, []);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/returns");
      const result = await res.json();
      setReturns(result.data || []);
    } catch {
      toast.error("Failed to load return requests");
    } finally { setLoading(false); }
  };

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/returns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(`Request ${status}`);
      loadReturns();
    } catch { toast.error("Failed to update"); }
    finally { setUpdating(null); }
  };

  const filtered = returns.filter(r => {
    const search = searchQuery.toLowerCase();
    const matchSearch = r.id.includes(search) || r.order_id.includes(search) || r.profile?.full_name?.toLowerCase().includes(search) || r.profile?.email?.toLowerCase().includes(search);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-[1400px] text-[#0F172A] font-sans animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-slate-200 rounded-md mb-2"></div>
            <div className="h-4 w-48 sm:w-80 bg-slate-200 rounded-md"></div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#EEF2F7] rounded-md p-4 shadow-sm">
              <div className="h-3 w-16 bg-slate-200 rounded mb-2"></div>
              <div className="h-8 w-12 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md p-4 flex gap-4 items-center shadow-sm">
          <div className="relative flex-1 max-w-md">
            <div className="h-10 w-full bg-slate-200 rounded-md"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-5 py-3"><div className="h-3 w-20 bg-slate-200 rounded"></div></th>
                  <th className="px-5 py-3"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-5 py-3"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-5 py-3"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-5 py-3"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-5 py-3 flex justify-end"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-slate-200 rounded-full shrink-0"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-slate-200 rounded"></div>
                          <div className="h-3 w-32 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                    <td className="px-5 py-3"><div className="h-4 w-48 bg-slate-200 rounded"></div></td>
                    <td className="px-5 py-3"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                    <td className="px-5 py-3"><div className="h-6 w-20 bg-slate-200 rounded-md"></div></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="h-7 w-20 bg-slate-200 rounded-md"></div>
                        <div className="h-7 w-20 bg-slate-200 rounded-md"></div>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif-heading text-xl sm:text-xl sm:text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <CornerDownLeft className="w-5 sm:w-6 h-5 sm:h-6 text-indigo-500" />
            Return & Refund Requests
          </h2>
          <p className="text-sm sm:text-xs text-[#475569] mt-1">Manage customer return and refund requests.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: returns.length, color: "text-[#0F172A]" },
          { label: "Pending", value: returns.filter(r => r.status === "pending").length, color: "text-amber-600" },
          { label: "Approved", value: returns.filter(r => r.status === "approved").length, color: "text-blue-600" },
          { label: "Refunded", value: returns.filter(r => r.status === "refunded").length, color: "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#EEF2F7] rounded-md p-4 shadow-sm">
            <p className="text-xs lg:text-[10px] font-bold text-[#94A3B8] uppercase">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-md border border-[#EEF2F7] text-sm sm:text-xs font-semibold focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-md border border-[#EEF2F7] text-sm sm:text-xs font-bold focus:outline-none cursor-pointer bg-white">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm">
            <CornerDownLeft className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-bold">No return requests</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                    <th className="px-5 py-3 text-xs lg:text-[10px] font-black uppercase text-[#94A3B8]">Customer</th>
                    <th className="px-5 py-3 text-xs lg:text-[10px] font-black uppercase text-[#94A3B8]">Order</th>
                    <th className="px-5 py-3 text-xs lg:text-[10px] font-black uppercase text-[#94A3B8]">Reason</th>
                    <th className="px-5 py-3 text-xs lg:text-[10px] font-black uppercase text-[#94A3B8]">Date</th>
                    <th className="px-5 py-3 text-xs lg:text-[10px] font-black uppercase text-[#94A3B8]">Status</th>
                    <th className="px-5 py-3 text-xs lg:text-[10px] font-black uppercase text-[#94A3B8] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F7]">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-[#F8FAFC]/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs font-bold text-[#0F172A]">{r.profile?.full_name || "Unknown"}</p>
                            <p className="text-xs lg:text-[10px] text-[#64748B]">{r.profile?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold text-[#475569]">#{r.order_id.slice(0, 8)}</span>
                      </td>
                      <td className="px-5 py-3 max-w-[250px]">
                        <p className="text-xs text-[#475569] truncate">{r.reason}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-[#64748B]">{new Date(r.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs lg:text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1 ${STATUS_COLORS[r.status] || ""}`}>
                          <span className={`w-1.5 h-1.5 rounded-sm ${r.status === "pending" ? "bg-amber-500" : r.status === "approved" ? "bg-blue-500" : r.status === "rejected" ? "bg-rose-500" : "bg-emerald-500"}`} />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === "pending" && (
                            <>
                              <button onClick={() => handleStatus(r.id, "approved")} disabled={updating === r.id}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs lg:text-[10px] font-bold rounded-md border border-blue-200 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                              <button onClick={() => handleStatus(r.id, "rejected")} disabled={updating === r.id}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs lg:text-[10px] font-bold rounded-md border border-rose-200 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <button onClick={() => handleStatus(r.id, "refunded")} disabled={updating === r.id}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs lg:text-[10px] font-bold rounded-md border border-emerald-200 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1">
                              <Undo2 className="w-3 h-3" /> Mark Refunded
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-[#EEF2F7]">
              {filtered.map(r => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-[#0F172A]">{r.profile?.full_name || "Unknown"}</p>
                      <p className="text-xs text-[#64748B]">{r.profile?.email}</p>
                    </div>
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md border inline-flex items-center gap-1 shrink-0 ${STATUS_COLORS[r.status] || ""}`}>
                      <span className={`w-1 h-1 rounded-sm ${r.status === "pending" ? "bg-amber-500" : r.status === "approved" ? "bg-blue-500" : r.status === "rejected" ? "bg-rose-500" : "bg-emerald-500"}`} />
                      {r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#94A3B8] font-semibold">Order</span>
                      <p className="font-bold text-[#0F172A]">#{r.order_id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] font-semibold">Date</span>
                      <p className="font-medium text-[#475569]">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#94A3B8] font-semibold text-xs">Reason</span>
                    <p className="text-sm text-[#475569] mt-1">{r.reason}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {r.status === "pending" && (
                      <>
                        <button onClick={() => handleStatus(r.id, "approved")} disabled={updating === r.id}
                          className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-md border border-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => handleStatus(r.id, "rejected")} disabled={updating === r.id}
                          className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-md border border-rose-200 transition-all disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {r.status === "approved" && (
                      <button onClick={() => handleStatus(r.id, "refunded")} disabled={updating === r.id}
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200 transition-all disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer">
                        <Undo2 className="w-3.5 h-3.5" /> Mark Refunded
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
