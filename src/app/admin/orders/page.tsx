"use client";

import {
    Calendar,
    CheckCircle,
    CreditCard,
    Eye,
    Filter,
    Loader2,
    Mail,
    MapPin,
    Package,
    RefreshCw,
    Search,
    Trash2,
    X
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    name: string;
    images?: string[];
  };
}

interface Order {
  id: string;
  user_id: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  tax: number;
  total: number;
  shipping_address?: {
    full_name: string;
    phone?: string;
    address_line_1: string;
    city?: string;
    postal_code?: string;
  };
  payment_status: "pending" | "paid";
  payment_method?: string;
  payment_id?: string;
  created_at: string;
  updated_at?: string;
  profile?: {
    full_name?: string;
    email: string;
  };
  order_items?: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "past">("all");
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to load orders list");
      }

      setOrders(result.data || []);
    } catch (err: any) {
      toast.error(err.message || "Database connection failed");
    } finally {
      setLoading(false);
    }
  };

  // Update order status/payment status
  const handleUpdateStatus = async (
    orderId: string,
    updates: { status?: Order["status"]; payment_status?: Order["payment_status"] }
  ) => {
    const toastId = toast.loading("Updating order in database...");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, ...updates }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to update order");
      }

      toast.success("Order updated successfully", { id: toastId });
      
      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
      );

      // If modal is open, update selectedOrder
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, ...updates } : null);
      }
    } catch (err: any) {
      toast.error(err.message || "Update failed", { id: toastId });
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Order #${orderId}?`)) return;

    const toastId = toast.loading("Deleting order record...");
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to delete order");
      }

      toast.success("Order deleted successfully", { id: toastId });
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder?.id === orderId) {
        setIsDetailModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Deletion failed", { id: toastId });
    }
  };

  // Helper: Name Formatter
  const getDisplayName = (fullName?: string, email?: string) => {
    if (fullName && fullName.trim() !== "" && fullName !== email) {
      return fullName;
    }
    if (!email) return "Guest Customer";
    const parts = email.split("@")[0].split(/[\._-]/);
    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  // Helper: Avatar Generator
  const getAvatarGradient = (email?: string) => {
    if (!email) return "from-slate-400 to-slate-500 text-white";
    const colors = [
      "from-amber-400 to-orange-500 text-black",
      "from-emerald-400 to-teal-500 text-white",
      "from-sky-400 to-indigo-500 text-white",
      "from-pink-400 to-rose-500 text-white",
      "from-purple-400 to-indigo-600 text-white",
      "from-yellow-400 to-amber-500 text-black",
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Filtering Logic
  const activeOrders = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  );
  const pastOrders = orders.filter(
    (o) => o.status === "delivered" || o.status === "cancelled"
  );

  const filteredOrders = orders.filter((order) => {
    // 1. Search Query (order ID, customer name, customer email)
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.shipping_address?.full_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (order.profile?.full_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (order.profile?.email || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    // 2. Status Dropdown Filter
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    // 3. Payment Dropdown Filter
    const matchesPayment =
      paymentFilter === "all" || order.payment_status === paymentFilter;

    // 4. Tab selection
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && order.status !== "delivered" && order.status !== "cancelled") ||
      (activeTab === "past" && (order.status === "delivered" || order.status === "cancelled"));

    return matchesSearch && matchesStatus && matchesPayment && matchesTab;
  });

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EEF2F7] shadow-sm">
        <div>
          <h1 className="font-serif-heading text-2xl font-black text-[#0F172A] tracking-tight">
            Orders Registry
          </h1>
          <p className="text-xs text-[#64748B] font-medium mt-1">
            Monitor, update shipment statuses, verify payments, and manage e-commerce orders.
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#EEF2F7] hover:bg-[#F8FAFC] text-[#475569] font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Main Filter & List Container */}
      <div className="bg-white rounded-3xl border border-[#EEF2F7] shadow-sm overflow-hidden">
        {/* Top filter inputs */}
        <div className="p-5 border-b border-[#EEF2F7] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EEF2F7] bg-slate-50/50 text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3.5 py-2 rounded-xl transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10">
              <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3.5 py-2 rounded-xl transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10">
              <CreditCard className="w-3.5 h-3.5 text-[#94A3B8]" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending Payment</option>
                <option value="paid">Verified Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-6 border-b border-[#EEF2F7] px-6 bg-slate-50/40">
          <button
            onClick={() => setActiveTab("all")}
            className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "all"
                ? "border-amber-500 text-slate-950"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            All Orders
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "all" ? "bg-amber-500/10 text-amber-700" : "bg-[#EEF2F7] text-[#64748B]"
            }`}>
              {orders.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab("active")}
            className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "active"
                ? "border-amber-500 text-slate-950"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Active Orders
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "active" ? "bg-emerald-50 text-emerald-700" : "bg-[#EEF2F7] text-[#64748B]"
            }`}>
              {activeOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("past")}
            className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "past"
                ? "border-amber-500 text-slate-950"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Past Orders
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "past" ? "bg-rose-50 text-rose-700" : "bg-[#EEF2F7] text-[#64748B]"
            }`}>
              {pastOrders.length}
            </span>
          </button>
        </div>

        {/* Content list / table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-xs font-semibold text-[#64748B]">
              Retrieving orders database...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-transparent space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-extrabold text-[#0F172A]">No Database Records Found</h3>
            <p className="text-xs text-[#94A3B8] max-w-xs mx-auto font-medium">
              Try adjusting the status dropdowns, search query, or order categories.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-[#EEF2F7] bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-[#475569] tracking-wider w-12 text-center">No.</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-[#475569] tracking-wider w-1/4">Order ID & Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-[#475569] tracking-wider w-1/4">Customer Info</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-[#475569] tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-[#475569] tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-[#475569] tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-[#475569] tracking-wider text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {filteredOrders.map((order, index) => {
                  const displayName = getDisplayName(
                    order.shipping_address?.full_name || order.profile?.full_name,
                    order.profile?.email
                  );
                  const avatarColor = getAvatarGradient(order.profile?.email);
                  
                  // Product summarize
                  const firstItem = order.order_items?.[0];
                  const totalItemsCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  const itemSummary = firstItem?.product?.name 
                    ? `${firstItem.product.name}${totalItemsCount > 1 ? ` + ${totalItemsCount - 1} other items` : ""}`
                    : "Premium Mango Crate";

                  return (
                    <tr key={order.id} className="hover:bg-[#F8FAFC]/80 transition-colors border-b border-[#EEF2F7] last:border-b-0">
                      {/* Numbering */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-black text-[#94A3B8] font-mono">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </td>

                      {/* Order ID & Date */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-extrabold text-[#0F172A] uppercase">
                          #{order.id.slice(0, 8)}...
                        </p>
                        <p className="text-[10px] text-[#64748B] flex items-center gap-1 mt-0.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </p>
                      </td>

                      {/* Customer Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${avatarColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-[#0F172A] truncate">
                              {displayName}
                            </p>
                            <p className="text-[10px] text-[#64748B] truncate flex items-center gap-1 mt-0.5 font-medium">
                              <Mail className="w-3 h-3 shrink-0 text-[#94A3B8]" />
                              {order.profile?.email || "Guest checkout"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-extrabold text-[#475569] uppercase">
                          {order.payment_method || "COD"}
                        </p>
                        <div className="mt-1">
                          <button
                            onClick={() => handleUpdateStatus(order.id, { 
                              payment_status: order.payment_status === "paid" ? "pending" : "paid" 
                            })}
                            title="Click to toggle payment status"
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border transition-all cursor-pointer inline-flex items-center gap-1 ${
                              order.payment_status === "paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-100"
                            }`}
                          >
                            <span className={`w-1 h-1 rounded-full ${order.payment_status === "paid" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                            {order.payment_status === "paid" ? "Verified" : "Pending"}
                          </button>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-black text-[#0F172A]">
                          ৳ {order.total}
                        </span>
                        <p className="text-[9px] text-[#94A3B8] font-semibold mt-0.5">
                          {totalItemsCount} {totalItemsCount === 1 ? "crate" : "crates"}
                        </p>
                      </td>

                      {/* Status Selector */}
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, { status: e.target.value as any })}
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer ${
                            order.status === "delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            order.status === "cancelled" ? "bg-rose-50 text-rose-700 border-rose-200" :
                            order.status === "shipped" ? "bg-sky-50 text-sky-700 border-sky-200" :
                            order.status === "processing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            order.status === "confirmed" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetailModal(order)}
                            title="View order details"
                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            title="Delete Order Record"
                            className="p-2 rounded-xl border border-rose-200 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:shadow-rose-100 hover:scale-105 transition-all duration-200 cursor-pointer shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====== DETAIL / EDIT MODAL ====== */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDetailModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white border border-[#EEF2F7] rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in text-left flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#EEF2F7] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[#0F172A]">
                  Order Details
                </h3>
                <p className="text-[10px] text-[#94A3B8]">
                  ID: #{selectedOrder.id}
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg border border-[#EEF2F7] bg-white text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
              {/* Customer summary */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(selectedOrder.profile?.email)} flex items-center justify-center font-bold text-sm shrink-0 shadow-sm`}>
                  {getDisplayName(selectedOrder.shipping_address?.full_name || selectedOrder.profile?.full_name, selectedOrder.profile?.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#0F172A]">
                    {getDisplayName(selectedOrder.shipping_address?.full_name || selectedOrder.profile?.full_name, selectedOrder.profile?.email)}
                  </p>
                  <p className="text-[10px] text-[#64748B] flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                    {selectedOrder.profile?.email || "Guest Customer"}
                  </p>
                </div>
              </div>

              {/* Status Update section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#475569] tracking-wider block">
                    Shipment Status
                  </label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, { status: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EEF2F7] text-xs font-bold text-[#475569] bg-white focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#475569] tracking-wider block">
                    Payment Status
                  </label>
                  <select
                    value={selectedOrder.payment_status}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, { payment_status: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EEF2F7] text-xs font-bold text-[#475569] bg-white focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid (Verified)</option>
                  </select>
                </div>
              </div>

              {/* Order Progress Timeline */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100">
                <h4 className="text-[10px] font-black uppercase text-[#475569] tracking-wider flex items-center gap-1 mb-3">
                  <CheckCircle className="w-3.5 h-3.5 text-[#94A3B8]" />
                  Order Progress
                </h4>
                <div className="flex items-center justify-between relative">
                  {/* Connecting line */}
                  <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-slate-200 rounded z-0" />
                  <div
                    className="absolute top-3.5 left-0 h-0.5 bg-emerald-500 rounded z-0 transition-all duration-500"
                    style={{
                      width: (() => {
                        const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
                        const idx = steps.indexOf(selectedOrder.status);
                        if (selectedOrder.status === "cancelled") return "0%";
                        return `${(idx / (steps.length - 1)) * 100}%`;
                      })(),
                    }}
                  />
                  {/* Steps */}
                  {[
                    { key: "pending", label: "Placed" },
                    { key: "confirmed", label: "Confirmed" },
                    { key: "processing", label: "Processing" },
                    { key: "shipped", label: "Shipped" },
                    { key: "delivered", label: "Delivered" },
                  ].map((step) => {
                    const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
                    const currentIdx = steps.indexOf(selectedOrder.status);
                    const stepIdx = steps.indexOf(step.key);
                    const isCompleted = currentIdx >= stepIdx && selectedOrder.status !== "cancelled";
                    const isCurrent = step.key === selectedOrder.status;
                    const isCancelled = selectedOrder.status === "cancelled";
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-1 relative z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                            isCancelled
                              ? "bg-slate-100 border-slate-300 text-slate-400"
                              : isCompleted
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200"
                              : isCurrent
                              ? "bg-amber-400 border-amber-400 text-black shadow-md shadow-amber-200"
                              : "bg-white border-slate-300 text-slate-400"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            steps.indexOf(step.key) + 1
                          )}
                        </div>
                        <span className={`text-[9px] font-bold whitespace-nowrap ${
                          isCancelled ? "text-slate-400" :
                          isCompleted ? "text-emerald-700" :
                          isCurrent ? "text-amber-700" : "text-slate-400"
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {selectedOrder.status === "cancelled" && (
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 text-[10px] font-black rounded-full border border-rose-200">
                      ✕ This order has been cancelled
                    </span>
                  </div>
                )}
              </div>

              {/* Shipping Address details */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-[#475569] tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                  Shipping Information
                </h4>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-[#475569] space-y-1">
                  <p className="text-[#0F172A] font-extrabold">{selectedOrder.shipping_address?.full_name}</p>
                  <p>{selectedOrder.shipping_address?.address_line_1}</p>
                  {selectedOrder.shipping_address?.city && (
                    <p>{selectedOrder.shipping_address?.city} {selectedOrder.shipping_address?.postal_code}</p>
                  )}
                  {selectedOrder.shipping_address?.phone && (
                    <p className="pt-1 text-[#64748B] flex items-center gap-1 font-medium">
                      Phone: {selectedOrder.shipping_address?.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Order items list */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-[#475569] tracking-wider flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-[#94A3B8]" />
                  Crate Item List
                </h4>
                <div className="border border-[#EEF2F7] rounded-2xl overflow-hidden divide-y divide-[#EEF2F7]">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-white">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={item.product?.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&auto=format&fit=crop&q=80"}
                          alt="Mango product"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold text-[#0F172A] truncate">
                          {item.product?.name || "Premium Crate"}
                        </p>
                        <p className="text-[10px] text-[#94A3B8] font-bold">
                          ৳ {item.unit_price} &times; {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-[#0F172A]">
                          ৳ {item.total_price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 text-xs font-bold text-[#475569]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-[#0F172A]">৳ {selectedOrder.subtotal || selectedOrder.total}</span>
                </div>
                {selectedOrder.tax > 0 && (
                  <div className="flex justify-between">
                    <span>VAT / Tax</span>
                    <span className="text-[#0F172A]">৳ {selectedOrder.tax}</span>
                  </div>
                )}
                <div className="border-t border-[#EEF2F7] pt-2 mt-2 flex justify-between text-sm font-black text-[#0F172A]">
                  <span>Total Amount</span>
                  <span className="text-base text-emerald-600">৳ {selectedOrder.total}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#EEF2F7] flex justify-end gap-3 bg-[#F8FAFC]">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
