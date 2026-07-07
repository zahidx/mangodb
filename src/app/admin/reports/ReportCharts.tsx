// @ts-nocheck
"use client";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface ReportData {
  totalRevenue: number;
  totalSales: number;
  inventoryValue: number;
  customersCount: number;
  chartData: any[];
  topProducts?: { rank: number; name: string; quantity: number; revenue: number }[];
  statusDistribution?: { name: string; value: number; color: string }[];
  weeklyRevenue?: { week: string; revenue: number; orders: number }[];
}

const formatCurrency = (amount: number) => `৳ ${amount.toLocaleString("en-BD")}`;

export default function ReportCharts({ reportData }: { reportData: ReportData }) {
  return (
    <>
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
                tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }}
                minTickGap={30}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }}
                tickFormatter={(val) => `৳${val / 1000}k`}
                dx={-10}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", fontWeight: 600 }}
                itemStyle={{ color: "#22D3EE" }}
                labelStyle={{ color: "#94A3B8", marginBottom: "4px" }}
                formatter={(value: any) => [formatCurrency(Number(value || 0)), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0891B2" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
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
                tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }}
                minTickGap={30}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: "#F8FAFC" }}
                contentStyle={{ backgroundColor: "#0F172A", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", fontWeight: 600 }}
                itemStyle={{ color: "#22D3EE" }}
                labelStyle={{ color: "#94A3B8", marginBottom: "4px" }}
              />
              <Bar dataKey="orders" fill="#0891B2" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>

      {/* Second Row: Top Products + Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-black text-[#0F172A]">Top Selling Products</h3>
          <p className="text-[10px] text-[#64748B]">Best performers by revenue.</p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={(reportData.topProducts || []).slice(0, 7)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2F7" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#475569", fontWeight: 700 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                cursor={{ fill: "#F8FAFC" }}
                contentStyle={{ backgroundColor: "#0F172A", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px" }}
                formatter={(value: any) => [`৳${Number(value).toLocaleString("en-BD")}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#06B6D4" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-black text-[#0F172A]">Order Status Distribution</h3>
          <p className="text-[10px] text-[#64748B]">Breakdown of all orders by status.</p>
        </div>
        <div className="h-[300px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={reportData.statusDistribution || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {(reportData.statusDistribution || []).map((entry: any, idx: number) => (
                  <Cell key={idx} fill={entry.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px" }}
                formatter={(value: any, name: any) => [value, name]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: "#475569", fontSize: "11px", fontWeight: 600 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>

      {/* Third Row: Weekly Revenue */}
      {reportData.weeklyRevenue && reportData.weeklyRevenue.length > 0 && (
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-black text-[#0F172A]">Weekly Revenue</h3>
            <p className="text-[10px] text-[#64748B]">Revenue aggregated by week.</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.weeklyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 600 }}
                  tickFormatter={(val) => `৳${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F172A", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px" }}
                  formatter={(value: any) => [`৳${Number(value).toLocaleString("en-BD")}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}
