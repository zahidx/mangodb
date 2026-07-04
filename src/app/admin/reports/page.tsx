"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  Download,
  Calendar,
  Loader2,
  DollarSign
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";
import toast from "react-hot-toast";

interface ReportData {
  totalRevenue: number;
  totalSales: number;
  inventoryValue: number;
  customersCount: number;
  chartData: any[];
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [timeframe, setTimeframe] = useState("30d");

  useEffect(() => {
    loadReports();
  }, [timeframe]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?timeframe=${timeframe}`);
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error);
      setReportData(result.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch analytical reports");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `৳ ${amount.toLocaleString("en-BD")}`;

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
          <p className="text-xs font-semibold text-[#475569]">Generating reports...</p>
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
            <BarChart3 className="w-6 h-6 text-cyan-600" />
            Analytics & Reports
          </h2>
          <p className="text-xs text-[#475569] mt-1">
            Track your store's financial performance and sales trends.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-[#EEF2F7] px-3.5 py-2 rounded-md shadow-sm transition-all focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/10">
            <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="12m">Last 12 Months</option>
            </select>
          </div>
          <button className="px-4.5 py-2.5 bg-slate-900 hover:bg-cyan-600 text-white font-black text-xs uppercase tracking-wider rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md">
            <Download className="w-4 h-4 text-current" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Net Revenue</span>
            <div className="w-8 h-8 rounded-md bg-cyan-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-cyan-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{formatCurrency(reportData.totalRevenue)}</p>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
            <TrendingUp className="w-3 h-3" /> +12.5% vs last period
          </div>
        </div>

        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{reportData.totalSales}</p>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
            <TrendingUp className="w-3 h-3" /> +4.2% vs last period
          </div>
        </div>

        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Inventory Value</span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{formatCurrency(reportData.inventoryValue)}</p>
          <div className="text-[10px] font-medium text-[#94A3B8] pt-1">Current total warehouse value</div>
        </div>

        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-violet-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Customers</span>
            <div className="w-8 h-8 rounded-md bg-violet-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{reportData.customersCount}</p>
          <div className="text-[10px] font-medium text-[#94A3B8] pt-1">Registered accounts</div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Revenue Chart */}
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 shadow-sm lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-sm font-black text-[#0F172A]">Revenue Trend</h3>
            <p className="text-[10px] text-[#64748B]">Daily gross revenue over the selected timeframe.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891B2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0891B2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  minTickGap={30}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  tickFormatter={(val) => `৳${val/1000}k`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600 }}
                  itemStyle={{ color: '#22D3EE' }}
                  labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                  formatter={(value: any) => [formatCurrency(Number(value || 0)), "Revenue"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0891B2" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Volume Chart */}
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 shadow-sm">
          <div className="mb-6">
            <h3 className="text-sm font-black text-[#0F172A]">Order Volume</h3>
            <p className="text-[10px] text-[#64748B]">Number of orders placed.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  minTickGap={30}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600 }}
                  itemStyle={{ color: '#22D3EE' }}
                  labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                />
                <Bar dataKey="orders" fill="#0891B2" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
