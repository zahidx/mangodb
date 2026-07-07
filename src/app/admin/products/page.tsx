"use client";

import {
    ArrowUpDown,
    Edit2,
    Filter,
    Image as ImageIcon,
    Layers,
    Loader2,
    Package,
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
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price: number | null;
  stock: number;
  category_id: string;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export default function AdminProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const categoryFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageUploading(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formDataPayload = new FormData();
        formDataPayload.append("file", file);
        formDataPayload.append("bucket", "product-images");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formDataPayload,
        });
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error);
        uploadedUrls.push(result.url);
      }

      // Append new URLs to existing images
      const existingImages = formData.images ? formData.images.split(",").map(i => i.trim()).filter(i => i) : [];
      const allImages = [...existingImages, ...uploadedUrls];
      setFormData({ ...formData, images: allImages.join(", ") });
      
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const images = formData.images.split(",").map(i => i.trim()).filter(i => i);
    images.splice(index, 1);
    setFormData({ ...formData, images: images.join(", ") });
  };

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: 0,
    sale_price: "",
    stock: 0,
    category_id: "",
    images: "",
    is_active: true,
    is_featured: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories")
      ]);
      const prodResult = await prodRes.json();
      const catResult = await catRes.json();
      
      if (!prodRes.ok) throw new Error(prodResult.error);
      setProducts(prodResult.data || []);

      if (catRes.ok && catResult.data) {
        setCategories(catResult.data);
      } else {
        // Fallback to extracting from products if category API fails
        const uniqueCats = Array.from(new Set(
          (prodResult.data || [])
            .filter((p: Product) => p.category)
            .map((p: Product) => JSON.stringify(p.category))
        )).map((s: any) => JSON.parse(s)) as Category[];
        setCategories(uniqueCats);
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to fetch products");
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
      price: 0,
      sale_price: "",
      stock: 0,
      category_id: categories.length > 0 ? categories[0].id : "",
      images: "",
      is_active: true,
      is_featured: false,
    });
    setCurrentProduct(null);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Name and Slug are required");
      return;
    }

    const payload = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      price: Number(formData.price),
      sale_price: formData.sale_price ? Number(formData.sale_price) : null,
      stock: Number(formData.stock),
      category_id: formData.category_id || null,
      images: formData.images.split(",").map(i => i.trim()).filter(i => i),
      is_active: formData.is_active,
      is_featured: formData.is_featured,
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("Product added successfully!");
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Could not add product");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    const payload = {
      id: currentProduct.id,
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      price: Number(formData.price),
      sale_price: formData.sale_price ? Number(formData.sale_price) : null,
      stock: Number(formData.stock),
      category_id: formData.category_id || null,
      images: formData.images.split(",").map(i => i.trim()).filter(i => i),
      is_active: formData.is_active,
      is_featured: formData.is_featured,
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("Product updated successfully!");
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Could not update product");
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success(`${name} has been deleted.`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Could not delete product");
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, is_active: !product.is_active }),
      });
      if (!res.ok) throw new Error("Update failed");
      
      setProducts(products.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
      toast.success(`Product ${!product.is_active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: product.price,
      sale_price: product.sale_price?.toString() || "",
      stock: product.stock,
      category_id: product.category_id || "",
      images: product.images?.join(", ") || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setIsEditModalOpen(true);
  };

  const filteredProducts = products
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === "all" ? true : p.category_id === categoryFilter;
      const matchStatus = statusFilter === "all" ? true : statusFilter === "active" ? p.is_active : !p.is_active;
      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      else if (sortBy === "price") comparison = a.price - b.price;
      else if (sortBy === "stock") comparison = a.stock - b.stock;
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (type: "name" | "price" | "stock") => {
    if (sortBy === type) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(type); setSortOrder("asc"); }
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
          <div className="h-10 w-32 bg-slate-200 rounded-md shrink-0"></div>
        </div>

        {/* Filters Bar Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md p-4 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="h-10 w-full lg:w-96 bg-slate-200 rounded-md"></div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
            <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1"></div>
            <div className="h-10 w-20 bg-slate-200 rounded-md"></div>
            <div className="h-10 w-20 bg-slate-200 rounded-md"></div>
            <div className="h-10 w-20 bg-slate-200 rounded-md"></div>
          </div>
        </div>

        {/* Product List Card Skeleton */}
        <div className="bg-white border border-[#EEF2F7] rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                  <th className="px-6 py-4"><div className="h-3 w-20 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-12 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-12 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                  <th className="px-6 py-4 flex justify-end"><div className="h-3 w-16 bg-slate-200 rounded"></div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7]">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-md shrink-0"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-slate-200 rounded"></div>
                          <div className="h-3 w-24 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-200 rounded-md"></div></td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-16 bg-slate-200 rounded"></div>
                        <div className="h-3 w-12 bg-slate-200 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-200 rounded-md"></div></td>
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
          <h2 className="font-serif-heading text-xl sm:text-2xl font-black text-[#0F172A] flex items-center gap-2">
            <Package className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" />
            Product Catalog
          </h2>
          <p className="text-sm sm:text-xs text-[#475569] mt-1">
            Manage your store inventory, add new products, update pricing, and adjust stock levels.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="w-fit self-end sm:self-auto px-4.5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4 text-current" />
          Add Product
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#EEF2F7] rounded-md p-3 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-between shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-md border border-[#EEF2F7] bg-slate-50/50 text-sm sm:text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-md transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 flex-1 sm:flex-none">
            <Layers className="w-4 sm:w-3.5 h-4 sm:h-3.5 text-[#94A3B8]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-sm sm:text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer w-full"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#EEF2F7] px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-md transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 flex-1 sm:flex-none">
            <Filter className="w-4 sm:w-3.5 h-4 sm:h-3.5 text-[#94A3B8]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-sm sm:text-xs font-bold text-[#475569] border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer w-full"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={() => toggleSort("name")} className={`flex items-center gap-1 text-sm sm:text-xs font-bold px-3.5 py-2.5 sm:py-2 rounded-md border transition-all cursor-pointer flex-1 sm:flex-none justify-center ${sortBy === "name" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
              Name <ArrowUpDown className="w-3.5 sm:w-3 h-3.5 sm:h-3" />
            </button>
            <button onClick={() => toggleSort("price")} className={`flex items-center gap-1 text-sm sm:text-xs font-bold px-3.5 py-2.5 sm:py-2 rounded-md border transition-all cursor-pointer flex-1 sm:flex-none justify-center ${sortBy === "price" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
              Price <ArrowUpDown className="w-3.5 sm:w-3 h-3.5 sm:h-3" />
            </button>
            <button onClick={() => toggleSort("stock")} className={`flex items-center gap-1 text-sm sm:text-xs font-bold px-3.5 py-2.5 sm:py-2 rounded-md border transition-all cursor-pointer flex-1 sm:flex-none justify-center ${sortBy === "stock" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-[#475569] border-[#EEF2F7]"}`}>
              Stock <ArrowUpDown className="w-3.5 sm:w-3 h-3.5 sm:h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Product List - Desktop Table / Mobile Cards */}
      <div className="bg-white lg:border lg:border-[#EEF2F7] lg:rounded-md lg:shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] text-sm bg-white border border-[#EEF2F7] rounded-md shadow-sm">
            <Package className="w-10 h-10 mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-bold">No products found</p>
            <p className="text-xs text-[#94A3B8] mt-1 mb-4">Try adjusting your filters or adding a new product.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Product Info</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs lg:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F7]">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-[#0F172A] truncate">{product.name}</p>
                            <p className="text-xs lg:text-[10px] text-[#64748B] truncate mt-0.5 font-medium">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs lg:text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md uppercase">
                          {product.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#0F172A]">{formatCurrency(product.price)}</span>
                          {product.sale_price && (
                            <span className="text-xs lg:text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md w-fit mt-1">
                              Sale: {formatCurrency(product.sale_price)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs lg:text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                          product.stock > 10 ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : 
                          product.stock > 0 ? "bg-amber-50 text-amber-700 border-amber-200/50" : 
                          "bg-red-50 text-red-700 border-red-200/50"
                        }`}>{product.stock} in stock</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs lg:text-[10px] font-black uppercase px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 shadow-sm ${
                          product.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-50 text-slate-600 border-slate-200/50"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-sm ${product.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {product.is_active ? "Active" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button onClick={() => handleToggleStatus(product)} title={product.is_active ? "Mark as Draft" : "Publish Product"}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors duration-200 shadow-inner ${
                              !product.is_active ? "bg-slate-200" : "bg-emerald-500"
                            }`}>
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-md bg-white shadow-sm transition duration-200 ${
                              !product.is_active ? "translate-x-0" : "translate-x-4"
                            }`} />
                          </button>
                          <button onClick={() => openEditModal(product)} className="p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id, product.name)} className="p-2 rounded-md border border-rose-200 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden flex flex-col gap-4 p-4 bg-slate-50/50">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white border border-[#EEF2F7] rounded-md shadow-sm p-4.5 space-y-4">
                  {/* Top Header: Category and Status Badges */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#F8FAFC] pb-3">
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {product.category?.name || "Uncategorized"}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                      product.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-50 text-slate-600 border-slate-200/50"
                    }`}>
                      <span className={`w-1 h-1 rounded-sm ${product.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {product.is_active ? "Active" : "Draft"}
                    </span>
                  </div>

                  {/* Middle Section: Image + Title + Slug + Stock */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden shadow-sm">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-[#0F172A] leading-snug truncate">{product.name}</p>
                      <p className="text-[10px] text-[#64748B] font-mono mt-1 truncate">{product.slug}</p>
                      <div className="mt-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          product.stock > 10 ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : 
                          product.stock > 0 ? "bg-amber-50 text-amber-700 border-amber-200/50" : 
                          "bg-red-50 text-red-700 border-red-200/50"
                        }`}>{product.stock} in stock</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Actions Section */}
                  <div className="pt-3.5 border-t border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between bg-slate-50/50 rounded-md p-2.5 border border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pricing</span>
                      <div className="flex items-baseline gap-2">
                        {product.sale_price ? (
                          <>
                            <span className="text-xs font-bold text-slate-400 line-through">{formatCurrency(product.price)}</span>
                            <span className="text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                              {formatCurrency(product.sale_price)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-black text-[#0F172A]">{formatCurrency(product.price)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* Toggle status */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active:</span>
                        <button onClick={() => handleToggleStatus(product)}
                          className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-md border-2 border-transparent transition-colors duration-200 shadow-inner focus:outline-none ${
                            !product.is_active ? "bg-slate-200" : "bg-emerald-500"
                          }`}>
                          <span className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-md bg-white shadow-sm transition duration-200 ${
                            !product.is_active ? "translate-x-0" : "translate-x-4.5"
                          }`} />
                        </button>
                      </div>

                      {/* Edit / Delete Buttons */}
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(product)} className="p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm cursor-pointer">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id, product.name)} className="p-2 rounded-md border border-rose-200 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ====== PRODUCT MODAL (Add/Edit) ====== */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} />
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-md shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] text-left font-sans text-slate-800 animate-modal-enter">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-serif-heading text-lg font-black text-slate-900 leading-tight">
                  {isAddModalOpen ? "Add New Product" : "Edit Product"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Configure details, pricing, and inventory.</p>
              </div>
              <button
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="w-8 h-8 rounded-full border border-slate-200/60 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleAddProduct : handleUpdateProduct} className="p-6 overflow-y-auto space-y-6">
              
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Product Name *</label>
                    <input type="text" required value={formData.name} onChange={(e) => handleNameChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Slug *</label>
                    <input type="text" required value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Description</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">Pricing & Inventory</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Regular Price (৳) *</label>
                    <input type="number" required min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Sale Price (৳)</label>
                    <input type="number" min="0" step="0.01" value={formData.sale_price} onChange={(e) => setFormData({...formData, sale_price: e.target.value})} placeholder="Optional" className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Stock Quantity *</label>
                    <input type="number" required min="0" value={formData.stock} onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200" />
                  </div>
                </div>
              </div>

              {/* Organization & Media */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">Organization & Media</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Category</label>
                    <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 cursor-pointer">
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Product Images</label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageUploading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-350 text-slate-600 font-bold text-xs rounded-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        {imageUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-500" />
                        )}
                        <span>{imageUploading ? "Uploading..." : "Upload Images"}</span>
                      </button>
                      {formData.images && (
                        <span className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-100 px-2 py-1 rounded">
                          {formData.images.split(",").filter(i => i.trim()).length} image(s)
                        </span>
                      )}
                    </div>
                    {/* Image Previews */}
                    {formData.images && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.images.split(",").map((url, idx) => {
                          const trimmed = url.trim();
                          if (!trimmed) return null;
                          return (
                            <div key={idx} className="relative group w-16 h-16 rounded-md border border-slate-200 overflow-hidden bg-slate-50">
                              <img src={trimmed} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer animate-fade-in"
                              >
                                <X className="w-4 h-4 text-white" strokeWidth={2.5} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">Supported: JPEG, PNG, WebP, GIF. Max 5MB each.</p>
                  </div>
                </div>
                
                <div className="flex gap-6 mt-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 rounded border-slate-350 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer" />
                    <span>Product is Active</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({...formData, is_featured: e.target.checked})} className="w-4 h-4 rounded border-slate-350 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer" />
                    <span>Feature on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 mt-6 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-850 font-black text-xs uppercase tracking-wider rounded-md transition-all duration-200 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-md shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer">
                  {isAddModalOpen ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
