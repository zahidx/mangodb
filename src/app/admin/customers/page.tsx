"use client";

import { useAuth } from "@/context/AuthContext";
import {
    ArrowUpDown,
    Calendar,
    Edit2,
    Filter,
    Loader2,
    Mail,
    Phone,
    Plus,
    Search,
    Shield,
    Trash2,
    UserCheck,
    Users,
    X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
  is_blocked: boolean;
  created_at: string;
  order_count?: number;
  total_spent?: number;
}

// Helper to format clean display names from email if name is empty or matches email
const getDisplayName = (fullName: string | null, email: string) => {
  if (!fullName) return "No Name Provided";
  const rawName = !fullName.includes("@") ? fullName : (fullName.split("@")[0] || email.split("@")[0]);
  return rawName
    .split(/[\s._-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper to choose a beautiful dynamic gradient for the avatar based on customer email
const getAvatarGradient = (email: string) => {
  const char = (email || "a").charAt(0).toLowerCase();
  if (char >= "a" && char <= "e") return "from-amber-400 to-orange-500 text-white shadow-orange-500/10";
  if (char >= "f" && char <= "j") return "from-pink-400 to-rose-500 text-white shadow-rose-500/10";
  if (char >= "k" && char <= "o") return "from-sky-400 to-indigo-500 text-white shadow-indigo-500/10";
  if (char >= "p" && char <= "t") return "from-emerald-400 to-teal-500 text-white shadow-emerald-500/10";
  return "from-violet-400 to-purple-500 text-white shadow-purple-500/10";
};

export default function AdminCustomersPage() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "user" as "user" | "admin",
    is_blocked: false,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSeedCustomers = async () => {
    setSeeding(true);
    const toastId = toast.loading("Seeding customer database...");
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to seed database");
      }
      toast.success("Database seeded successfully!", { id: toastId });
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || "Seeding failed", { id: toastId });
    } finally {
      setSeeding(false);
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Failed to load customers");
      }
      
      setCustomers(result.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to fetch customer registry");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Create Customer Action via API
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast.error("Name and Email are required");
      return;
    }

    const payload = {
      id: `cust-${Date.now()}`,
      full_name: formData.full_name,
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      is_blocked: formData.is_blocked,
    };

    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to add customer");
      }

      toast.success("Customer added successfully!");
      setIsAddModalOpen(false);
      resetForm();
      loadCustomers(); // Reload list to reflect database state
    } catch (err: any) {
      toast.error(err.message || "Could not add customer to database");
    }
  };

  // Update Customer Action via API
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;

    const payload = {
      id: currentCustomer.id,
      full_name: formData.full_name,
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      is_blocked: formData.is_blocked,
    };

    try {
      const res = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to update customer");
      }

      toast.success("Customer details updated!");
      setIsEditModalOpen(false);
      resetForm();
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update database profile");
    }
  };

  // Toggle Block Status via API
  const handleToggleBlock = async (customer: Customer) => {
    const nextBlocked = !customer.is_blocked;
    const payload = {
      id: customer.id,
      full_name: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      is_blocked: nextBlocked,
    };

    try {
      const res = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to toggle status");
      }

      toast.success(nextBlocked ? "Customer account suspended" : "Customer account activated");
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || "Database update failed");
    }
  };

  // Toggle Role via API
  const handleToggleRole = async (customer: Customer) => {
    const nextRole = customer.role === "admin" ? "user" : "admin";
    const payload = {
      id: customer.id,
      full_name: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      role: nextRole,
      is_blocked: customer.is_blocked,
    };

    try {
      const res = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to toggle user role");
      }

      toast.success(`Role updated to ${nextRole.toUpperCase()}`);
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || "Database update failed");
    }
  };

  // Delete Customer via API
  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/admin/customers?id=${id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to delete customer");
      }

      toast.success(`${name} has been deleted.`);
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || "Could not delete customer record");
    }
  };

  const openEditModal = (customer: Customer) => {
    setCurrentCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      is_blocked: customer.is_blocked,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      role: "user",
      is_blocked: false,
    });
    setCurrentCustomer(null);
  };

  // Filter & Sort Logic
  const filteredCustomers = customers
    .filter((c) => {
      const matchSearch =
        (c.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || "").includes(searchQuery);

      const matchRole = roleFilter === "all" ? true : c.role === roleFilter;
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "blocked"
          ? c.is_blocked
          : !c.is_blocked;

      return matchSearch && matchRole && matchStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = (a.full_name || "").localeCompare(b.full_name || "");
      } else {
        comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (type: "name" | "date") => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(type);
      setSortOrder("desc");
    }
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

        {/* Stats Overview Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-slate-200 rounded"></div>
                <div className="w-4 h-4 rounded-md bg-slate-200"></div>
              </div>
              <div className="h-8 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Filters Bar Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md p-3 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between shadow-sm">
          <div className="h-10 w-full lg:w-96 bg-slate-200 rounded-md"></div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
            <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-md"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-md"></div>
          </div>
        </div>

        {/* Customer List Card Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4"><div className="h-3 w-24 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-12 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-12 bg-slate-200 rounded"></div></th>
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
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-slate-200 rounded"></div>
                          <div className="h-3 w-32 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-8 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-200 rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
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
            <Users className="w-5 sm:w-6 h-5 sm:h-6 text-amber-500" />
            Customer Management
          </h2>
          <p className="text-sm sm:text-xs text-[#475569] mt-1">
            View active user profiles, add customers manually, adjust access, and block accounts directly from database API.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="w-fit self-end sm:self-auto px-4.5 py-2.5 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-black text-xs uppercase tracking-wider rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md hover:shadow-amber-500/15"
        >
          <Plus className="w-4 h-4 text-current" />
          Add Customer
        </button>
      </div>

      {/* Stats Overview */}
      {customers.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Customers</span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-[#0F172A]">{customers.length}</p>
          </div>
          <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Active</span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-600">
              {customers.filter(c => !c.is_blocked).length}
            </p>
          </div>
          <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Orders</span>
              <span className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
                <span className="text-blue-600 font-black text-sm">#</span>
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-blue-600">
              {customers.reduce((sum, c) => sum + (c.order_count || 0), 0)}
            </p>
          </div>
          <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs lg:text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Revenue</span>
              <span className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center">
                <span className="text-emerald-600 font-black text-sm">৳</span>
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-600">
              ৳ {customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toLocaleString("en-BD")}
            </p>
          </div>
        </div>
      )}

      {/* Seed prompt for empty database */}
      {customers.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-amber-700 flex items-center gap-2">
              <Users className="w-4 h-4 animate-pulse" />
              Database Registry Empty
            </h3>
            <p className="text-xs text-[#475569]">
              Your database has no customer accounts yet. Seed with sample profiles (names, emails, phones, roles) to start testing?
            </p>
          </div>
          <button
            onClick={handleSeedCustomers}
            disabled={seeding}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {seeding ? "Seeding..." : "Seed Demo Customers"}
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-3 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-md border border-[#EEF2F7] bg-slate-50/50 text-sm sm:text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
          />
        </div>

        {/* Dropdowns & Sorts */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-md transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 flex-1 sm:flex-none">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-transparent text-sm sm:text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3 sm:px-3.5 py-2.5 sm:py-2 rounded-md transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 flex-1 sm:flex-none">
            <Shield className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-sm sm:text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Suspended</option>
            </select>
          </div>

          <span className="w-px h-6 bg-slate-200 hidden sm:block mx-1" />

          {/* Sort Buttons */}
          <button onClick={() => toggleSort("name")}
            className={`flex items-center gap-1 text-sm sm:text-xs font-bold px-3.5 py-2.5 sm:py-2 rounded-md border transition-all cursor-pointer flex-1 sm:flex-none justify-center ${
              sortBy === "name" ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-white text-[#475569] border-[#EEF2F7]"
            }`}>
            Name <ArrowUpDown className="w-3.5 sm:w-3 h-3.5 sm:h-3 ml-0.5" />
          </button>
          <button onClick={() => toggleSort("date")}
            className={`flex items-center gap-1 text-sm sm:text-xs font-bold px-3.5 py-2.5 sm:py-2 rounded-md border transition-all cursor-pointer flex-1 sm:flex-none justify-center ${
              sortBy === "date" ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-white text-[#475569] border-[#EEF2F7]"
            }`}>
            Join Date <ArrowUpDown className="w-3.5 sm:w-3 h-3.5 sm:h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Customer List Card */}
      <div className="bg-white lg:border lg:border-[#EEF2F7] lg:rounded-md lg:shadow-sm overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm bg-white border border-[#EEF2F7] rounded-md shadow-sm">
            <Users className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-bold">No database records found</p>
            <p className="text-xs text-[#94A3B8] mt-1 mb-4">Try adding a user, seeding demo data, or adjusting search query.</p>
            {customers.length === 0 && (
              <button onClick={handleSeedCustomers} disabled={seeding}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-bold text-xs rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Seed Demo Customers
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Customer Details</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Total Spent</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F7]">
                  {filteredCustomers.map((customer) => {
                    const displayName = getDisplayName(customer.full_name, customer.email);
                    const avatarColor = getAvatarGradient(customer.email);
                    return (
                      <tr key={customer.id} className="hover:bg-[#F8FAFC]/80 transition-colors border-b border-[#EEF2F7] last:border-b-0">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-md bg-gradient-to-tr ${avatarColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-[#0F172A] truncate">{displayName}</p>
                              <p className="text-xs lg:text-[10px] text-[#64748B] truncate flex items-center gap-1 mt-0.5 font-medium">
                                <Mail className="w-3 h-3 shrink-0 text-[#94A3B8]" />{customer.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {customer.phone ? (
                            <p className="text-xs font-semibold text-[#475569] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#94A3B8]" />{customer.phone}
                            </p>
                          ) : (
                            <span className="text-xs lg:text-[10px] text-[#94A3B8] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md font-semibold italic">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-extrabold text-[#0F172A]">{customer.order_count ?? 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black text-emerald-600">
                            ৳ {((customer.total_spent ?? 0)).toLocaleString("en-BD")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleToggleRole(customer)}
                            className={`text-xs lg:text-[10px] font-black uppercase px-2.5 py-1 rounded-md border transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm ${
                              customer.role === "admin" ? "bg-indigo-50 text-indigo-700 border-indigo-200/50 hover:bg-indigo-100" : "bg-slate-50 text-slate-600 border-slate-200/50 hover:bg-slate-100"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-sm ${customer.role === "admin" ? "bg-indigo-500" : "bg-slate-400"}`} />
                            {customer.role}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs lg:text-[10px] font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm ${
                            customer.is_blocked ? "bg-rose-50 text-rose-700 border-rose-200/50" : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-sm ${customer.is_blocked ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`} />
                            {customer.is_blocked ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-[#475569] flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                            {new Date(customer.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button onClick={() => handleToggleBlock(customer)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors shadow-inner ${
                                customer.is_blocked ? "bg-slate-200" : "bg-emerald-500"
                              }`}>
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-md bg-white shadow-sm transition duration-200 ${
                                customer.is_blocked ? "translate-x-0" : "translate-x-4"
                              }`} />
                            </button>
                            <button onClick={() => openEditModal(customer)} title="Edit Customer"
                              className="p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm cursor-pointer">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteCustomer(customer.id, customer.full_name)} title="Delete Customer"
                              className="p-2 rounded-md border border-rose-200 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer">
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

            {/* Mobile cards */}
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-slate-50/50">
              {filteredCustomers.map((customer) => {
                const displayName = getDisplayName(customer.full_name, customer.email);
                const avatarColor = getAvatarGradient(customer.email);
                return (
                  <div key={customer.id} className="bg-white border border-[#EEF2F7] rounded-md shadow-sm p-4.5 space-y-3.5">
                    {/* Top Header: Role & Status Badges */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#F8FAFC] pb-2.5">
                      <button
                        onClick={() => handleToggleRole(customer)}
                        title="Click to toggle user role"
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border inline-flex items-center gap-1 transition-all cursor-pointer hover:scale-[1.03] ${
                          customer.role === "admin" ? "bg-indigo-50 text-indigo-700 border-indigo-200/50" : "bg-slate-50 text-slate-600 border-slate-200/50"
                        }`}
                      >
                        <span className={`w-1 h-1 rounded-sm ${customer.role === "admin" ? "bg-indigo-500" : "bg-slate-400"}`} />
                        Role: {customer.role}
                      </button>

                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                        customer.is_blocked ? "bg-rose-50 text-rose-700 border-rose-200/50" : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                      }`}>
                        <span className={`w-1 h-1 rounded-sm ${customer.is_blocked ? "bg-rose-500" : "bg-emerald-500"}`} />
                        {customer.is_blocked ? "Suspended" : "Active"}
                      </span>
                    </div>

                    {/* Middle Section: Avatar + Customer Main details */}
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-md bg-gradient-to-tr ${avatarColor} flex items-center justify-center font-bold text-sm shrink-0 shadow-sm`}>
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-slate-900 truncate">{displayName}</p>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5 font-medium">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          {customer.email}
                        </p>
                        {customer.phone && (
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5 font-medium">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats Box */}
                    <div className="bg-slate-50/50 border border-slate-100/60 p-3 rounded-md grid grid-cols-2 gap-4 divide-x divide-slate-100 text-left">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Orders</span>
                        <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{customer.order_count ?? 0}</span>
                      </div>
                      <div className="pl-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Spent</span>
                        <span className="text-sm font-black text-emerald-600 mt-0.5 block">
                          ৳ {((customer.total_spent ?? 0)).toLocaleString("en-BD")}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-slate-400">
                        Joined {new Date(customer.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>

                      <div className="flex items-center gap-3">
                        {/* Block Account Switch */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suspend:</span>
                          <button onClick={() => handleToggleBlock(customer)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors duration-200 shadow-inner focus:outline-none ${customer.is_blocked ? "bg-rose-500" : "bg-slate-200"}`}>
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-md bg-white shadow-sm transition duration-200 ${customer.is_blocked ? "translate-x-4" : "translate-x-0"}`} />
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEditModal(customer)} title="Edit Customer" className="p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteCustomer(customer.id, customer.full_name)} title="Delete Customer" className="p-2 rounded-md border border-rose-200 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ====== ADD CUSTOMER MODAL ====== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-md shadow-2xl overflow-hidden z-10 flex flex-col text-left font-sans text-slate-800 animate-modal-enter">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-serif-heading text-lg font-black text-slate-900 leading-tight">Add Customer</h3>
                <p className="text-xs text-slate-400 mt-1">Create a new database customer profile.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200/60 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zahid Islam"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. zahid@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 01712345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200 cursor-pointer"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Access Status</label>
                  <select
                    value={formData.is_blocked ? "blocked" : "active"}
                    onChange={(e) => setFormData({ ...formData, is_blocked: e.target.value === "blocked" })}
                    className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 mt-6 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 font-black text-xs uppercase tracking-wider rounded-md transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-black text-xs uppercase tracking-wider rounded-md shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== EDIT CUSTOMER MODAL ====== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-md shadow-2xl overflow-hidden z-10 flex flex-col text-left font-sans text-slate-800 animate-modal-enter">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-serif-heading text-lg font-black text-slate-900 leading-tight">Edit Customer Details</h3>
                <p className="text-xs text-slate-400 mt-1">Modify database record fields for this customer.</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200/60 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zahid Islam"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. zahid@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 01712345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200 cursor-pointer"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Access Status</label>
                  <select
                    value={formData.is_blocked ? "blocked" : "active"}
                    onChange={(e) => setFormData({ ...formData, is_blocked: e.target.value === "blocked" })}
                    className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all duration-200 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 mt-6 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 font-black text-xs uppercase tracking-wider rounded-md transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-black text-xs uppercase tracking-wider rounded-md shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
