"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  Shield,
  Mail,
  Phone,
  Calendar,
  Loader2,
  X,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
  is_blocked: boolean;
  created_at: string;
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs font-semibold text-[#475569]">Loading customer registry...</p>
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
            <Users className="w-6 h-6 text-amber-500" />
            Customer Management
          </h2>
          <p className="text-xs text-[#475569] mt-1">
            View active user profiles, add customers manually, adjust access, and block accounts directly from database API.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="px-4.5 py-2.5 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md hover:shadow-amber-500/15"
        >
          <Plus className="w-4 h-4 text-current" />
          Add Customer
        </button>
      </div>

      {/* Seed prompt for empty database */}
      {customers.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {seeding ? "Seeding..." : "Seed Demo Customers"}
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white border border-[#EEF2F7] rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EEF2F7] bg-slate-50/50 text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
          />
        </div>

        {/* Dropdowns & Sorts */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3.5 py-2 rounded-xl transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3.5 py-2 rounded-xl transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10">
            <Shield className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Suspended</option>
            </select>
          </div>

          <span className="w-px h-6 bg-slate-200 hidden sm:block mx-1" />

          {/* Sort Buttons */}
          <button
            onClick={() => toggleSort("name")}
            className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
              sortBy === "name"
                ? "bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-sm hover:bg-amber-600"
                : "bg-white text-[#475569] border-[#EEF2F7] hover:bg-[#F8FAFC]"
            }`}
          >
            Name
            <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>

          <button
            onClick={() => toggleSort("date")}
            className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
              sortBy === "date"
                ? "bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-sm hover:bg-amber-600"
                : "bg-white text-[#475569] border-[#EEF2F7] hover:bg-[#F8FAFC]"
            }`}
          >
            Join Date
            <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Customer List Card */}
      <div className="bg-white border border-[#EEF2F7] rounded-2xl shadow-sm overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm">
            <Users className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-bold">No database records found</p>
            <p className="text-xs text-[#94A3B8] mt-1 mb-4">Try adding a user, seeding demo data, or adjusting search query.</p>
            {customers.length === 0 && (
              <button
                onClick={handleSeedCustomers}
                disabled={seeding}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Seed Demo Customers
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Customer Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Join Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {filteredCustomers.map((customer) => {
                  const displayName = getDisplayName(customer.full_name, customer.email);
                  const avatarColor = getAvatarGradient(customer.email);
                  return (
                    <tr key={customer.id} className="hover:bg-[#F8FAFC]/80 transition-colors border-b border-[#EEF2F7] last:border-b-0">
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${avatarColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-[#0F172A] truncate">
                              {displayName}
                            </p>
                            <p className="text-[10px] text-[#64748B] truncate flex items-center gap-1 mt-0.5 font-medium">
                              <Mail className="w-3 h-3 shrink-0 text-[#94A3B8]" />
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4">
                        {customer.phone ? (
                          <p className="text-xs font-semibold text-[#475569] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#94A3B8]" />
                            {customer.phone}
                          </p>
                        ) : (
                          <span className="text-[10px] text-[#94A3B8] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md font-semibold italic">Not Provided</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleRole(customer)}
                          title="Click to toggle role"
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm ${
                            customer.role === "admin"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200/50 hover:bg-indigo-100"
                              : "bg-slate-50 text-slate-600 border-slate-200/50 hover:bg-slate-100"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${customer.role === "admin" ? "bg-indigo-500" : "bg-slate-400"}`} />
                          {customer.role}
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 shadow-sm ${
                            customer.is_blocked
                              ? "bg-rose-50 text-rose-700 border-rose-200/50"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${customer.is_blocked ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`} />
                          {customer.is_blocked ? "Suspended" : "Active"}
                        </span>
                      </td>

                      {/* Join Date */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-[#475569] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                          {new Date(customer.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Sliding Toggle Switch */}
                          <button
                            onClick={() => handleToggleBlock(customer)}
                            title={customer.is_blocked ? "Activate customer account" : "Suspend customer account"}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner hover:scale-105 active:scale-95 ${
                              customer.is_blocked ? "bg-slate-200 hover:bg-slate-300" : "bg-emerald-500 hover:bg-emerald-600"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                customer.is_blocked ? "translate-x-0" : "translate-x-4"
                              }`}
                            />
                          </button>

                          <button
                            onClick={() => openEditModal(customer)}
                            title="Edit Customer"
                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer shadow-sm"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteCustomer(customer.id, customer.full_name)}
                            title="Delete Customer"
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

      {/* ====== ADD CUSTOMER MODAL ====== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white border border-[#EEF2F7] rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in text-left">
            <div className="p-6 border-b border-[#EEF2F7] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[#0F172A]">Add Customer</h3>
                <p className="text-[10px] text-[#94A3B8]">Create a new database customer profile.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg border border-[#EEF2F7] bg-white text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#475569] tracking-wider block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zahid Islam"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EEF2F7] text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#475569] tracking-wider block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. zahid@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EEF2F7] text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#475569] tracking-wider block">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 01712345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EEF2F7] text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#475569] tracking-wider block">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EEF2F7] text-xs font-bold text-[#475569] focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#475569] tracking-wider block">
                    Access Status
                  </label>
                  <select
                    value={formData.is_blocked ? "blocked" : "active"}
                    onChange={(e) => setFormData({ ...formData, is_blocked: e.target.value === "blocked" })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EEF2F7] text-xs font-bold text-[#475569] focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[#EEF2F7] pt-4 mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#EEF2F7] hover:bg-[#F8FAFC] text-[#475569] font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
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
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white border border-[#EEF2F7] rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in text-left">
            <div className="p-6 border-b border-[#EEF2F7] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[#0F172A]">Edit Customer Details</h3>
                <p className="text-[10px] text-[#94A3B8]">Modify database record fields for this customer.</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg border border-[#EEF2F7] bg-white text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#475569] tracking-wider block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zahid Islam"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EEF2F7] text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#475569] tracking-wider block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. zahid@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EEF2F7] text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#475569] tracking-wider block">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 01712345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EEF2F7] text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#475569] tracking-wider block">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EEF2F7] text-xs font-bold text-[#475569] focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#475569] tracking-wider block">
                    Access Status
                  </label>
                  <select
                    value={formData.is_blocked ? "blocked" : "active"}
                    onChange={(e) => setFormData({ ...formData, is_blocked: e.target.value === "blocked" })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EEF2F7] text-xs font-bold text-[#475569] focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[#EEF2F7] pt-4 mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-[#EEF2F7] hover:bg-[#F8FAFC] text-[#475569] font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
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
