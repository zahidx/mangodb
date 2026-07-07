"use client";

import { Loader2, Mail, RefreshCw, ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminAbandonedCartsPage() {
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [recoverResult, setRecoverResult] = useState<any>(null);
  const [dryRun, setDryRun] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/carts/recover");
      const data = await res.json();
      if (res.ok) setStats(data);
      else toast.error(data.error);
    } catch {
      toast.error("Failed to load abandoned cart stats");
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    if (!confirm(`This will send recovery emails to ${stats?.total_abandoned || 0} abandoned cart(s). Continue?`)) return;

    setRecovering(true);
    setRecoverResult(null);
    try {
      const res = await fetch("/api/carts/recover", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRecoverResult(data);
        toast.success(`Sent ${data.sent} recovery email(s)!`);
        loadStats();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Recovery process failed");
    } finally {
      setRecovering(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="flex flex-col gap-6 text-[#0F172A] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Abandoned Cart Recovery</h1>
          <p className="text-sm text-gray-500 mt-0.5">Find and recover abandoned carts by sending email reminders.</p>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-200"></div>
                  <div className="h-3 w-24 bg-slate-200 rounded"></div>
                </div>
                <div className="h-8 w-16 bg-slate-200 rounded mb-1"></div>
                <div className="h-3 w-32 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-48 bg-slate-200 rounded"></div>
                <div className="h-4 w-96 bg-slate-200 rounded"></div>
                <div className="h-4 w-80 bg-slate-200 rounded"></div>
              </div>
              <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
              <div className="h-4 w-48 bg-slate-200 rounded"></div>
              <div className="h-3 w-96 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs lg:text-[10px] font-semibold text-gray-400 uppercase tracking-wider">24h+ Abandoned</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.total_abandoned || 0}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Carts untouched for &gt;24 hours</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs lg:text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Registered Users</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.abandoned_users_count || 0}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Logged-in users with abandoned carts</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs lg:text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Guest Records</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.abandoned_guest_records || 0}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Guest checkouts with saved emails</p>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Run Recovery Campaign</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                  Sends an email reminder with a 5% discount code (COMEBACK5) to all users who abandoned their cart over 24 hours ago.
                  Works for both registered users and guest checkouts.
                </p>
                {recoverResult && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-emerald-800">
                      ✅ {recoverResult.sent} email(s) sent successfully
                    </p>
                    {recoverResult.failed > 0 && (
                      <p className="text-amber-700 text-xs mt-1">
                        ⚠️ {recoverResult.failed} failed to send
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Total processed: {recoverResult.total_processed} · Cutoff: {stats?.cutoff_time ? new Date(stats.cutoff_time).toLocaleString() : "N/A"}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={handleRecover}
                disabled={recovering || !stats?.total_abandoned}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {recovering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {recovering ? "Sending..." : "Send Recovery Emails"}
              </button>
            </div>

            {/* Setup Instructions */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📋 Automated Setup (Cron Job)</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                To automate recovery, set up a cron job to call <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">POST /api/carts/recover</code> every 24 hours.
                <br />
                Example cron: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">0 9 * * * curl -X POST https://mangodb.com/api/carts/recover</code>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
