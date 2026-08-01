"use client";

import {
    Activity,
    AlertCircle,
    Clock,
    Code,
    Filter,
    Search,
    ShieldCheck,
    Terminal,
    User
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
  admin?: { full_name: string; email: string };
}

export default function AdminLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [schemaError, setSchemaError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    setSchemaError(false);
    try {
      const res = await fetch("/api/admin/logs");
      const result = await res.json();
      
      if (!res.ok) {
        if (result.error && result.error.includes("schema cache")) {
          setSchemaError(true);
          return;
        }
        throw new Error(result.error);
      }
      
      setLogs(result.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchMatch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.admin?.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    const filterMatch = filterType === "all" || log.entity_type.toLowerCase() === filterType.toLowerCase();
    
    return searchMatch && filterMatch;
  });

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('insert')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (a.includes('update') || a.includes('edit')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (a.includes('delete') || a.includes('remove')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
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
        <div className="bg-white border border-[#EEF2F7] rounded-md p-3 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between shadow-sm">
          <div className="h-10 w-full lg:w-96 bg-slate-200 rounded-md"></div>
          <div className="flex items-center gap-1.5 w-full lg:w-32">
            <div className="h-10 w-full bg-slate-200 rounded-md"></div>
          </div>
        </div>

        {/* Logs Table Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4"><div className="h-3 w-20 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-32 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-24 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-24 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4 flex justify-end"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 bg-slate-200 rounded-md shrink-0"></div>
                        <div className="flex flex-col space-y-2">
                          <div className="h-3 w-20 bg-slate-200 rounded"></div>
                          <div className="h-2 w-16 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-200 rounded-md shrink-0"></div>
                        <div className="flex flex-col space-y-2">
                          <div className="h-3 w-24 bg-slate-200 rounded"></div>
                          <div className="h-2 w-32 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 rounded-md"></div></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="h-3 w-16 bg-slate-200 rounded"></div>
                        <div className="h-2 w-24 bg-slate-200 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <div className="h-9 w-9 bg-slate-200 rounded-md"></div>
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
      <div className="flex flex-col gap-4 p-8 max-w-4xl mx-auto mt-10 bg-rose-50 border-2 border-rose-200 rounded-md shadow-sm">
        <h2 className="text-xl sm:text-2xl font-black text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-8 h-8" /> Database Setup Required!
        </h2>
        <p className="text-sm font-semibold text-rose-900">
          The activity_logs table has not been created yet (or your database cache needs a refresh). 
          Because we cannot run database migrations automatically from here, you must run this code in your Supabase SQL Editor.
        </p>
        <div className="space-y-2 mt-4">
          <p className="font-bold text-sm text-slate-800">Step 1: Go to <a href="https://supabase.com" target="_blank" className="text-blue-600 underline">Supabase Dashboard</a> and open the SQL Editor.</p>
          <p className="font-bold text-sm text-slate-800">Step 2: Copy and run this exact query:</p>
          <div className="relative">
            <textarea readOnly className="w-full h-96 p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-md" value={`-- 1. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON public.activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- 3. Enable Security
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. Set Permissions
CREATE POLICY "Admins can view activity logs" ON public.activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. FORCE REFRESH THE API CACHE (This fixes your error!)
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
          <h2 className="font-serif-heading text-xl sm:text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <Activity className="w-5 sm:w-6 h-5 sm:h-6 text-slate-700" />
            System Activity Logs
          </h2>
          <p className="text-sm sm:text-xs text-[#475569] mt-1">
            Audit trail of administrative actions performed across the platform.
          </p>
        </div>
        <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 border border-slate-200">
          <ShieldCheck className="w-4 h-4" /> Secure Audit Trail
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-3 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs by action, module, or user email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-md border border-[#EEF2F7] bg-slate-50/50 text-sm sm:text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-500/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-md transition-all focus-within:border-slate-500 focus-within:ring-4 focus-within:ring-slate-500/10 w-full lg:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-sm sm:text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
          >
            <option value="all">All Modules</option>
            <option value="product">Products</option>
            <option value="order">Orders</option>
            <option value="coupon">Coupons</option>
            <option value="user">Users</option>
            <option value="settings">Settings</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm">
            <Terminal className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-bold">No activity logs found</p>
            <p className="text-xs text-[#94A3B8] mt-1">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Administrator</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Action Event</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Module / Entity</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider text-right">Details Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F7]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F8FAFC]/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <div className="flex items-center gap-2 text-[#475569]">
                          <Clock className="w-3.5 h-3.5" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#0F172A]">
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-xs lg:text-[10px]">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#0F172A]">{log.admin?.full_name || "System Automated"}</span>
                            <span className="text-xs lg:text-[10px] text-[#64748B]">{log.admin?.email || "system@mangobite.local"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <span className={`text-xs lg:text-[10px] font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#0F172A] capitalize">{log.entity_type}</span>
                          {log.entity_id && (
                            <span className="text-[11px] lg:text-[9px] text-[#94A3B8] font-mono mt-0.5" title={log.entity_id}>
                              ID: {log.entity_id.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right align-top">
                        <button 
                          className="inline-flex items-center justify-center p-2 rounded-md border border-[#EEF2F7] bg-white text-[#475569] hover:bg-slate-50 hover:text-[#0F172A] transition-colors shadow-sm"
                          title={JSON.stringify(log.details, null, 2)}
                          onClick={() => toast.custom((t) => (
                            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 shadow-lg rounded-md pointer-events-auto flex flex-col`}>
                              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                                <span className="text-xs font-bold text-white flex items-center gap-2"><Code className="w-4 h-4 text-cyan-400" /> Payload Details</span>
                                <button onClick={() => toast.dismiss(t.id)} className="text-slate-400 hover:text-white"><AlertCircle className="w-4 h-4" /></button>
                              </div>
                              <pre className="p-4 text-xs lg:text-[10px] text-cyan-300 font-mono overflow-auto max-h-64">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          ))}
                        >
                          <Code className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-[#EEF2F7]">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-3">
                  {/* Timestamp & Admin */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-[#475569]">
                      <Clock className="w-3.5 h-3.5" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#0F172A]">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="inline-flex items-center justify-center p-2 rounded-md border border-[#EEF2F7] bg-white text-[#475569] hover:bg-slate-50 transition-colors shadow-sm"
                      title={JSON.stringify(log.details, null, 2)}
                      onClick={() => toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 shadow-lg rounded-md pointer-events-auto flex flex-col`}>
                          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-2"><Code className="w-4 h-4 text-cyan-400" /> Payload Details</span>
                            <button onClick={() => toast.dismiss(t.id)} className="text-slate-400 hover:text-white"><AlertCircle className="w-4 h-4" /></button>
                          </div>
                          <pre className="p-4 text-xs text-cyan-300 font-mono overflow-auto max-h-64">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      ))}
                    >
                      <Code className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Administrator */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#0F172A]">{log.admin?.full_name || "System Automated"}</span>
                      <span className="text-xs text-[#64748B]">{log.admin?.email || "system@mangobite.local"}</span>
                    </div>
                  </div>

                  {/* Action & Entity */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#0F172A] capitalize">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="text-xs text-[#94A3B8] font-mono" title={log.entity_id}>
                          ID: {log.entity_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
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
