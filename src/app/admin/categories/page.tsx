"use client";

import {
    ArrowUpDown,
    Edit2,
    Filter,
    Image as ImageIcon,
    Layers,
    Loader2,
    Plus,
    Search,
    Trash2,
    X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const formDataPayload = new FormData();
      formDataPayload.append("file", file);
      formDataPayload.append("bucket", "category-images");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataPayload,
      });
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error);
      
      setFormData({ ...formData, image_url: result.url });
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error);
      setCategories(result.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      image_url: "",
      is_active: true,
    });
    setCurrentCategory(null);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Name and Slug are required");
      return;
    }

    const payload = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
    };

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("Category added successfully!");
      setIsAddModalOpen(false);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Could not add category");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory) return;

    const payload = {
      id: currentCategory.id,
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
    };

    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("Category updated successfully!");
      setIsEditModalOpen(false);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Could not update category");
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the category "${name}"? Products inside this category might lose their category reference.`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success(`${name} has been deleted.`);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Could not delete category");
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id, is_active: !category.is_active }),
      });
      if (!res.ok) throw new Error("Update failed");
      
      setCategories(categories.map(c => c.id === category.id ? { ...c, is_active: !c.is_active } : c));
      toast.success(`Category ${!category.is_active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const openEditModal = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active,
    });
    setIsEditModalOpen(true);
  };

  const filteredCategories = categories
    .filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" ? true : statusFilter === "active" ? c.is_active : !c.is_active;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      else if (sortBy === "date") comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (type: "name" | "date") => {
    if (sortBy === type) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(type); setSortOrder("asc"); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-[#475569]">Loading categories...</p>
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
            <Layers className="w-6 h-6 text-amber-500" />
            Category Management
          </h2>
          <p className="text-xs text-[#475569] mt-1">
            Organize your product catalog, add new product collections, and manage store navigation.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="px-4.5 py-2.5 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-black text-xs uppercase tracking-wider rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4 text-current" />
          Add Category
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#EEF2F7] bg-slate-50/50 text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3.5 py-2 rounded-md transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <span className="w-px h-6 bg-slate-200 hidden sm:block mx-1" />

          <button onClick={() => toggleSort("name")} className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-md border transition-all cursor-pointer ${sortBy === "name" ? "bg-amber-500 text-slate-900 border-amber-500" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Name <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>
          <button onClick={() => toggleSort("date")} className={`flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-md border transition-all cursor-pointer ${sortBy === "date" ? "bg-amber-500 text-slate-900 border-amber-500" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
            Date <ArrowUpDown className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Categories List Card */}
      <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm">
            <Layers className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-bold">No categories found</p>
            <p className="text-xs text-[#94A3B8] mt-1 mb-4">Try adjusting your filters or adding a new category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Category Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    {/* Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                          {category.image_url ? (
                            <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="text-sm font-extrabold text-[#0F172A] truncate">
                            {category.name}
                          </p>
                          <p className="text-[10px] text-[#64748B] truncate mt-0.5 font-medium">
                            /{category.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 truncate max-w-[250px]">
                        {category.description || <span className="italic text-slate-400">No description</span>}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm ${
                        category.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-50 text-slate-600 border-slate-200/50"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-sm ${category.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {category.is_active ? "Active" : "Draft"}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-[#475569]">
                        {new Date(category.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleToggleStatus(category)}
                          title={category.is_active ? "Mark as Draft" : "Publish Category"}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner hover:scale-105 active:scale-95 ${
                            !category.is_active ? "bg-slate-200 hover:bg-slate-300" : "bg-emerald-500 hover:bg-emerald-600"
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-md bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            !category.is_active ? "translate-x-0" : "translate-x-4"
                          }`} />
                        </button>
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="p-2 rounded-md border border-rose-200 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====== CATEGORY MODAL (Add/Edit) ====== */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} />
          <div className="relative w-full max-w-lg bg-white border border-[#EEF2F7] rounded-md shadow-2xl overflow-hidden z-10 animate-fade-in text-left flex flex-col">
            <div className="p-6 border-b border-[#EEF2F7] flex items-center justify-between bg-[#F8FAFC] shrink-0">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[#0F172A]">{isAddModalOpen ? "Add New Category" : "Edit Category"}</h3>
                <p className="text-[10px] text-[#94A3B8]">Configure collection name and SEO details.</p>
              </div>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-1.5 rounded-md border border-[#EEF2F7] bg-white text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleAddCategory : handleUpdateCategory} className="p-6 space-y-5">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#475569]">Category Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Premium Crates" className="w-full px-3.5 py-2.5 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-amber-500" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#475569]">URL Slug *</label>
                  <input type="text" required value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} placeholder="e.g. premium-crates" className="w-full px-3.5 py-2.5 rounded-md border border-[#EEF2F7] text-xs font-semibold bg-slate-50 focus:outline-none focus:border-amber-500" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#475569]">Description</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Briefly describe this category..." className="w-full px-3.5 py-2.5 rounded-md border border-[#EEF2F7] text-xs font-semibold focus:outline-none focus:border-amber-500" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#475569]">Category Image</label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageUploading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 text-slate-700 font-bold text-xs rounded-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {imageUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                      {imageUploading ? "Uploading..." : "Upload Image"}
                    </button>
                    {/* Preview */}
                    {formData.image_url && (
                      <div className="relative group w-14 h-14 rounded-md border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: "" })}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Supported: JPEG, PNG, WebP, GIF. Max 5MB.</p>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A] cursor-pointer mt-2 w-fit">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                  Category is Active (Visible to customers)
                </label>
              </div>

              <div className="border-t border-[#EEF2F7] pt-5 mt-2 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 border border-[#EEF2F7] hover:bg-[#F8FAFC] text-[#475569] font-bold text-xs rounded-md transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs rounded-md shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  {isAddModalOpen ? "Create Category" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
