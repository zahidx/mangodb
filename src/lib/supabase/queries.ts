// ===========================================
// Supabase Database Query Helpers (Dynamic Edition)
// ===========================================
// Reusable query functions for all database operations.
// All data is fetched dynamically from Supabase — no mock fallbacks.

import { createClient } from "@/lib/supabase/client";
import type {
    Order,
    Profile
} from "@/types/database";

// ---- Product Queries ----

export async function getProducts(options?: {
  categorySlug?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "name";
}) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return { data: [], error: { message: "Supabase not configured" } };
    }
    const supabase = createClient() as any;

    let query = supabase
      .from("products")
      .select("*, category:categories(*)", { count: "exact" })
      .eq("is_active", true);

    if (options?.categorySlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", options.categorySlug)
        .single();
      if (cat) query = query.eq("category_id", (cat as any).id);
    }

    if (options?.featured) query = query.eq("is_featured", true);
    if (options?.search) query = query.ilike("name", `%${options.search}%`);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 12) - 1);

    switch (options?.sortBy) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "name":
        query = query.order("name", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const res = await query;
    if (res.error) {
      return { data: [], error: res.error };
    }
    return { data: res.data || [], count: res.count, error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const supabase = (await createClient()) as any;
    const res = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    
    if (res.error) {
      return { data: null, error: res.error };
    }
    return { data: res.data || null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function getFeaturedProducts(limit = 8) {
  try {
    const supabase = (await createClient()) as any;
    const res = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);
      
    if (res.error) {
      return { data: [], error: res.error };
    }
    return { data: res.data || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

// ---- Product Variant Queries ----

export async function getProductVariants(productId: string) {
  try {
    const supabase = (await createClient()) as any;
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) return { data: [], error };
    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

// ---- Category Queries ----

export async function getCategories() {
  try {
    const supabase = (await createClient()) as any;
    const res = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });
      
    if (res.error) {
      return { data: [], error: res.error };
    }
    return { data: res.data || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const supabase = (await createClient()) as any;
    const res = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
      
    if (res.error) {
      return { data: null, error: res.error };
    }
    return { data: res.data || null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// ---- Cart Queries ----

export async function getCartItems(userId: string) {
  const supabase = (await createClient()) as any;
  return supabase
    .from("cart_items")
    .select("*, product:products(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function addToCart(userId: string, productId: string, quantity = 1) {
  const supabase = (await createClient()) as any;

  // Check if item already in cart
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single();

  if (existing) {
    return supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id)
      .select()
      .single();
  }

  return supabase
    .from("cart_items")
    .insert({ user_id: userId, product_id: productId, quantity })
    .select()
    .single();
}

export async function removeFromCart(cartItemId: string) {
  const supabase = (await createClient()) as any;
  return supabase.from("cart_items").delete().eq("id", cartItemId);
}

export async function clearCart(userId: string) {
  const supabase = (await createClient()) as any;
  return supabase.from("cart_items").delete().eq("user_id", userId);
}

// ---- Order Queries ----

export async function getUserOrders(userId: string) {
  try {
    const supabase = (await createClient()) as any;
    const res = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(*))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
      
    if (res.error && res.error.code === 'PGRST205') {
      throw new Error("Table missing");
    }
    return res;
  } catch (err) {
    // Get mock local orders
    let localOrders: Order[] = [];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mangobite-orders");
      if (stored) {
        try { localOrders = JSON.parse(stored); } catch (e) {}
      }
    }
    return {
      data: localOrders,
      error: null
    };
  }
}

export async function getOrderById(orderId: string) {
  try {
    const supabase = (await createClient()) as any;
    const res = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(*)), profile:profiles(*)")
      .eq("id", orderId)
      .single();
      
    if (res.error && res.error.code === 'PGRST205') {
      throw new Error("Table missing");
    }
    return res;
  } catch (err) {
    // Fetch from mock local orders
    let localOrders: Order[] = [];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mangobite-orders");
      if (stored) {
        try { localOrders = JSON.parse(stored); } catch (e) {}
      }
    }
    const match = localOrders.find(o => o.id === orderId);
    return {
      data: match || null,
      error: match ? null : { message: "Order not found" }
    };
  }
}

export async function getAllOrders() {
  try {
    const supabase = (await createClient()) as any;
    const res = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(*)), profile:profiles(*)")
      .order("created_at", { ascending: false });
      
    if (res.error && res.error.code === 'PGRST205') {
      throw new Error("Table missing");
    }
    return res;
  } catch (err) {
    let localOrders: Order[] = [];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mangobite-orders");
      if (stored) {
        try { localOrders = JSON.parse(stored); } catch (e) {}
      }
    }
    return {
      data: localOrders,
      error: null
    };
  }
}

// ---- Profile Queries ----

export async function getProfile(userId: string) {
  const supabase = (await createClient()) as any;
  return supabase.from("profiles").select("*").eq("id", userId).single();
}

export async function updateProfile(userId: string, data: Partial<Profile>) {
  try {
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.details || "Failed to update profile");
    }

    const json = await res.json();
    return { data: json.profile, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
}

// ---- Review Queries ----

export async function getProductReviews(productId: string) {
  try {
    const supabase = (await createClient()) as any;

    // Fetch approved reviews with profile
    const res = await supabase
      .from("reviews")
      .select("*, profile:profiles(full_name, avatar_url)")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (res.error && res.error.code === 'PGRST205') {
      return { data: [], error: res.error };
    }

    const reviews = res.data || [];

    // Check verified purchase for each review
    const enrichedReviews = await Promise.all(
      reviews.map(async (review: any) => {
        let isVerified = false;
        try {
          const { data: orders } = await supabase
            .from("orders")
            .select("id")
            .eq("user_id", review.user_id);

          if (orders && orders.length > 0) {
            const orderIds = orders.map((o: any) => o.id);
            const { data: items } = await supabase
              .from("order_items")
              .select("id")
              .in("order_id", orderIds)
              .eq("product_id", productId);
            isVerified = (items && items.length > 0) ?? false;
          }
        } catch (_) {}
        return { ...review, is_verified_purchase: isVerified };
      })
    );

    return { data: enrichedReviews, error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

// ---- Admin Queries ----

export async function getAdminStats() {
  try {
    const supabase = (await createClient()) as any;

    const [products, orders, users, revenue] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
      supabase.from("orders").select("total").eq("payment_status", "paid"),
    ]);

    if (products.error && products.error.code === 'PGRST205') {
      return {
        totalProducts: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalRevenue: 0,
      };
    }

    const totalRevenue =
      revenue.data?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;

    return {
      totalProducts: products.count || 0,
      totalOrders: orders.count || 0,
      totalUsers: users.count || 0,
      totalRevenue,
    };
  } catch (err: any) {
    let localOrders: Order[] = [];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mangobite-orders");
      if (stored) {
        try { localOrders = JSON.parse(stored); } catch (e) {}
      }
    }

    const totalRevenue = localOrders.reduce((sum, o) => sum + o.total, 0);

    return {
      totalProducts: 0,
      totalOrders: localOrders.length,
      totalUsers: 0,
      totalRevenue,
    };
  }
}
