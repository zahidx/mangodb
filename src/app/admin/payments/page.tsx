"use client";

import {
    AlertCircle,
    ArrowUpDown,
    Banknote,
    CheckCircle2,
    CreditCard,
    Filter,
    Loader2,
    MoreVertical,
    RefreshCw,
    Search
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Profile {
  full_name: string;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_id: string | null;
  total: number;
  profile: Profile;
}

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "refunded" | "failed">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error);
      
      setOrders(result.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (id: string, newStatus: Order["payment_status"]) => {
    setActiveMenu(null);
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, payment_status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      
      setOrders(orders.map(o => o.id === id ? { ...o, payment_status: newStatus } : o));
      toast.success(`Payment marked as ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment status");
    } finally {
      setUpdating(null);
    }
  };

  // Derived Stats
  const totalRevenue = orders.filter(o => o.payment_status === "paid").reduce((acc, o) => acc + o.total, 0);
  const outstandingAmount = orders.filter(o => o.payment_status === "pending").reduce((acc, o) => acc + o.total, 0);
  const refundedAmount = orders.filter(o => o.payment_status === "refunded").reduce((acc, o) => acc + o.total, 0);
  
  const filteredOrders = orders
    .filter((o) => {
      const nameString = o.profile?.full_name?.toLowerCase() || "";
      const idString = o.id.toLowerCase();
      const txIdString = (o.payment_id || "").toLowerCase();
      
      const searchMatch = searchQuery === "" || 
        nameString.includes(searchQuery.toLowerCase()) || 
        idString.includes(searchQuery.toLowerCase()) ||
        txIdString.includes(searchQuery.toLowerCase());

      const statusMatch = statusFilter === "all" ? true : o.payment_status === statusFilter;

      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "amount") {
        comparison = a.total - b.total;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (type: "date" | "amount") => {
    if (sortBy === type) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(type); setSortOrder("desc"); }
  };

  const formatCurrency = (amount: number) => `৳ ${amount.toLocaleString("en-BD")}`;

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-slate-200 rounded"></div>
                <div className="w-8 h-8 rounded-md bg-slate-200"></div>
              </div>
              <div className="h-8 w-32 bg-slate-200 rounded"></div>
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

        {/* Payments List Table Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4"><div className="h-3 w-32 bg-slate-200 rounded"></div></th>
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
                      <div className="flex flex-col space-y-2">
                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
                        <div className="h-3 w-32 bg-slate-200 rounded"></div>
                        <div className="h-3 w-20 bg-slate-200 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 rounded-md"></div></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
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
            <CreditCard className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" />
            Payments & Transactions
          </h2>
          <p className="text-sm sm:text-xs text-[#475569] mt-1">
            Track revenue, manage manual payment approvals, and monitor refunds.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs lg:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#0F172A]">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs lg:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Outstanding (Pending)</span>
            <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#0F172A]">{formatCurrency(outstandingAmount)}</p>
        </div>

        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between">
            <span className="text-xs lg:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Refunds Processed</span>
            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#0F172A]">{formatCurrency(refundedAmount)}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-3 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, Order ID, or Transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-md border border-[#EEF2F7] bg-slate-50/50 text-sm sm:text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-md transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 flex-1 sm:flex-none">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-sm sm:text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Transactions</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <span className="w-px h-6 bg-slate-200 hidden sm:block mx-1" />

          <button onClick={() => toggleSort("date")} className={`flex items-center gap-1 font-bold px-3.5 py-2.5 sm:py-2 rounded-md border transition-all cursor-pointer flex-1 sm:flex-none justify-center text-sm sm:text-xs ${sortBy === "date" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Date <ArrowUpDown className="w-3.5 sm:w-3 h-3.5 sm:h-3 ml-0.5" />
          </button>
          <button onClick={() => toggleSort("amount")} className={`flex items-center gap-1 font-bold px-3.5 py-2.5 sm:py-2 rounded-md border transition-all cursor-pointer flex-1 sm:flex-none justify-center text-sm sm:text-xs ${sortBy === "amount" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Amount <ArrowUpDown className="w-3.5 sm:w-3 h-3.5 sm:h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Payments List Table */}
      <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm">
            <Banknote className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-bold">No transactions found</p>
            <p className="text-xs text-[#94A3B8] mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto min-h-[400px]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Transaction Details</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F7]">
                  {filteredOrders.map((order) => {
                    const isPaid = order.payment_status === "paid";
                    const isPending = order.payment_status === "pending";
                    const isFailed = order.payment_status === "failed";
                    const isRefunded = order.payment_status === "refunded";

                    return (
                      <tr key={order.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold text-[#0F172A]">Order #{order.id.slice(0, 8).toUpperCase()}</span>
                            <span className="text-xs lg:text-[10px] font-medium text-[#64748B] mt-0.5 font-mono">TxID: {order.payment_id || "N/A (Cash/Manual)"}</span>
                            <span className="text-xs lg:text-[10px] text-[#94A3B8] mt-1">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-[#475569]">{order.profile?.full_name || "Unknown Customer"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-[#0F172A]">{formatCurrency(order.total)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs lg:text-[10px] font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm ${isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : isPending ? "bg-amber-50 text-amber-700 border-amber-200/50" : isRefunded ? "bg-slate-50 text-slate-700 border-slate-200/50" : "bg-rose-50 text-rose-700 border-rose-200/50"}`}>
                            <span className={`w-1.5 h-1.5 rounded-sm ${isPaid ? "bg-emerald-500" : isPending ? "bg-amber-500 animate-pulse" : isRefunded ? "bg-slate-500" : "bg-rose-500"}`} />
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block text-left">
                            {updating === order.id ? (
                              <div className="p-2"><Loader2 className="w-4 h-4 animate-spin text-emerald-600" /></div>
                            ) : (
                              <>
                                <button onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)}
                                  className="p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer focus:outline-none">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {activeMenu === order.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white border border-[#EEF2F7] ring-1 ring-black ring-opacity-5 z-20 py-1">
                                      <div className="px-3 py-2 text-xs lg:text-[10px] font-black uppercase tracking-wider text-[#94A3B8] border-b border-[#EEF2F7] bg-[#F8FAFC]">Change Payment Status</div>
                                      {!isPaid && <button onClick={() => handleUpdatePaymentStatus(order.id, "paid")} className="w-full text-left block px-4 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors">Mark as Paid</button>}
                                      {!isPending && <button onClick={() => handleUpdatePaymentStatus(order.id, "pending")} className="w-full text-left block px-4 py-2.5 text-xs font-bold text-amber-600 hover:bg-amber-50 transition-colors">Mark as Pending</button>}
                                      {!isRefunded && isPaid && <button onClick={() => { if(window.confirm("Are you sure you want to mark this as refunded?")) handleUpdatePaymentStatus(order.id, "refunded"); }} className="w-full text-left block px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">Mark as Refunded</button>}
                                      {!isFailed && <button onClick={() => handleUpdatePaymentStatus(order.id, "failed")} className="w-full text-left block px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors">Mark as Failed</button>}
                                    </div>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-[#EEF2F7]">
              {filteredOrders.map((order) => {
                const isPaid = order.payment_status === "paid";
                const isPending = order.payment_status === "pending";
                const isFailed = order.payment_status === "failed";
                const isRefunded = order.payment_status === "refunded";

                return (
                  <div key={order.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#0F172A]">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{order.profile?.full_name || "Unknown Customer"}</p>
                      </div>
                      <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-md border inline-flex items-center gap-1 shrink-0 ${isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : isPending ? "bg-amber-50 text-amber-700 border-amber-200/50" : isRefunded ? "bg-slate-50 text-slate-700 border-slate-200/50" : "bg-rose-50 text-rose-700 border-rose-200/50"}`}>
                        <span className={`w-1 h-1 rounded-sm ${isPaid ? "bg-emerald-500" : isPending ? "bg-amber-500" : isRefunded ? "bg-slate-500" : "bg-rose-500"}`} />
                        {order.payment_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#94A3B8] font-semibold">Amount</span>
                        <p className="font-black text-[#0F172A]">{formatCurrency(order.total)}</p>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] font-semibold">Date</span>
                        <p className="font-medium text-[#475569]">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-[#64748B] font-mono">TxID: {order.payment_id || "N/A"}</span>
                      <div className="relative">
                        {updating === order.id ? (
                          <div className="p-2"><Loader2 className="w-4 h-4 animate-spin text-emerald-600" /></div>
                        ) : (
                          <>
                            <button onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)}
                              className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {activeMenu === order.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white border border-[#EEF2F7] ring-1 ring-black ring-opacity-5 z-20 py-1">
                                  <div className="px-3 py-2 text-xs font-black uppercase tracking-wider text-[#94A3B8] border-b border-[#EEF2F7] bg-[#F8FAFC]">Change Payment Status</div>
                                  {!isPaid && <button onClick={() => handleUpdatePaymentStatus(order.id, "paid")} className="w-full text-left block px-4 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50">Mark as Paid</button>}
                                  {!isPending && <button onClick={() => handleUpdatePaymentStatus(order.id, "pending")} className="w-full text-left block px-4 py-2.5 text-xs font-bold text-amber-600 hover:bg-amber-50">Mark as Pending</button>}
                                  {!isRefunded && isPaid && <button onClick={() => { if(window.confirm("Are you sure?")) handleUpdatePaymentStatus(order.id, "refunded"); }} className="w-full text-left block px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Mark as Refunded</button>}
                                  {!isFailed && <button onClick={() => handleUpdatePaymentStatus(order.id, "failed")} className="w-full text-left block px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50">Mark as Failed</button>}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
