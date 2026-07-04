"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquareQuote,
  Search,
  Star,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowUpDown,
  Trash2,
  Loader2,
  ShieldAlert,
  MessageCircleOff
} from "lucide-react";
import toast from "react-hot-toast";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_approved?: boolean;
  created_at: string;
  product?: { name: string; images: string[] };
  profile?: { full_name: string; email: string };
}

export default function AdminReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "hidden">("all");
  const [ratingFilter, setRatingFilter] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error);
      
      // Some DB schemas might not have is_approved yet, assume true if undefined
      const formattedData = (result.data || []).map((r: any) => ({
        ...r,
        is_approved: r.is_approved === undefined ? true : r.is_approved
      }));

      setReviews(formattedData);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (review: Review) => {
    setUpdating(review.id);
    try {
      const newStatus = !review.is_approved;
      const res = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, is_approved: newStatus }),
      });
      
      if (!res.ok) throw new Error("Status update failed");
      
      setReviews(reviews.map(r => r.id === review.id ? { ...r, is_approved: newStatus } : r));
      toast.success(`Review ${newStatus ? 'approved and visible' : 'hidden from public'}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update review status");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;

    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      
      setReviews(reviews.filter(r => r.id !== id));
      toast.success("Review deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Could not delete review");
    }
  };

  // Derived Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) : "0.0";
  const hiddenCount = reviews.filter(r => !r.is_approved).length;

  const filteredReviews = reviews
    .filter((r) => {
      const productMatch = r.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const userMatch = r.profile?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.profile?.email.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const commentMatch = r.comment?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      
      const searchMatch = searchQuery === "" || productMatch || userMatch || commentMatch;

      const statusMatch = statusFilter === "all" ? true :
        statusFilter === "approved" ? r.is_approved : !r.is_approved;

      const starMatch = ratingFilter === "all" ? true : r.rating.toString() === ratingFilter;

      return searchMatch && statusMatch && starMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "rating") {
        comparison = a.rating - b.rating;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (type: "date" | "rating") => {
    if (sortBy === type) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(type); setSortOrder("desc"); }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-3.5 h-3.5 ${star <= rating ? 'fill-amber-500 text-amber-500' : 'fill-slate-200 text-slate-200'}`} 
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-[#475569]">Loading customer reviews...</p>
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
            <MessageSquareQuote className="w-6 h-6 text-amber-500" />
            Product Reviews
          </h2>
          <p className="text-xs text-[#475569] mt-1">
            Monitor customer feedback, moderate comments, and track product ratings.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Reviews</span>
            <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
              <MessageSquareQuote className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{totalReviews}</p>
        </div>

        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Store Average</span>
            <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{avgRating} <span className="text-sm font-semibold text-[#94A3B8]">/ 5.0</span></p>
        </div>

        <div className="bg-white border border-[#EEF2F7] rounded-md p-5 space-y-3 shadow-sm border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Hidden / Rejected</span>
            <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{hiddenCount}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product, customer, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#EEF2F7] bg-slate-50/50 text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3.5 py-2 rounded-md transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10">
            <Star className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3.5 py-2 rounded-md transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="approved">Visible (Approved)</option>
              <option value="hidden">Hidden (Rejected)</option>
            </select>
          </div>

          <span className="w-px h-6 bg-slate-200 hidden sm:block mx-1" />

          <button onClick={() => toggleSort("date")} className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-md border transition-all cursor-pointer ${sortBy === "date" ? "bg-amber-500 text-slate-900 border-amber-500" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Date <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>
          <button onClick={() => toggleSort("rating")} className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-md border transition-all cursor-pointer ${sortBy === "rating" ? "bg-amber-500 text-slate-900 border-amber-500" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Rating <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm">
            <MessageCircleOff className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-bold">No reviews found</p>
            <p className="text-xs text-[#94A3B8] mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Product & Rating</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Customer Comment</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Reviewer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Visibility</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {filteredReviews.map((review) => {
                  return (
                    <tr key={review.id} className={`hover:bg-[#F8FAFC]/80 transition-colors ${!review.is_approved ? 'bg-slate-50/50' : ''}`}>
                      {/* Product & Rating */}
                      <td className="px-6 py-4 w-64 align-top">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md border border-[#EEF2F7] bg-white overflow-hidden shrink-0">
                              {review.product?.images?.[0] ? (
                                <img src={review.product.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-slate-100" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-[#0F172A] line-clamp-2">
                              {review.product?.name || "Unknown Product"}
                            </span>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                      </td>

                      {/* Comment */}
                      <td className="px-6 py-4 max-w-sm align-top">
                        <div className="text-xs text-[#475569] font-medium leading-relaxed bg-[#F8FAFC] p-3 rounded-md border border-[#EEF2F7]">
                          {review.comment ? `"${review.comment}"` : <span className="italic text-slate-400">No written comment provided.</span>}
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#0F172A]">{review.profile?.full_name || "Anonymous User"}</span>
                          <span className="text-[10px] text-[#94A3B8]">{review.profile?.email}</span>
                          <span className="text-[10px] text-[#94A3B8] mt-2">
                            {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 align-top">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm ${
                          review.is_approved ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-100 text-slate-600 border-slate-300"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-sm ${review.is_approved ? "bg-emerald-500" : "bg-slate-500"}`} />
                          {review.is_approved ? "Visible" : "Hidden"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right align-top">
                        <div className="flex items-start justify-end gap-2.5">
                          {updating === review.id ? (
                            <div className="p-2"><Loader2 className="w-4 h-4 animate-spin text-amber-500" /></div>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(review)}
                              title={review.is_approved ? "Hide Review" : "Approve & Show Review"}
                              className={`p-2 rounded-md border transition-all shadow-sm cursor-pointer ${
                                review.is_approved 
                                  ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-100" 
                                  : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              }`}
                            >
                              {review.is_approved ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(review.id)}
                            title="Delete Permanently"
                            className="p-2 rounded-md border border-rose-200 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
