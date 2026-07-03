// ===========================================
// Supabase Database Query Helpers (Hybrid Fallback Edition)
// ===========================================
// Reusable query functions for all database operations with mock fallbacks

import { createClient } from "@/lib/supabase/client";
import type {
  Product,
  Category,
  Order,
  CartItem,
  Profile,
  Review,
} from "@/types/database";

// ---- Mock Data Fallbacks ----

const MOCK_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Organic Harvest",
    slug: "organic",
    description: "100% chemical-free and carbide-free organic mangoes sourced directly from certified orchards.",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-2",
    name: "Premium Crates",
    slug: "premium",
    description: "Handpicked selection of premium grade mangoes packed in ventilated protective wooden crates.",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-3",
    name: "Festival Gift Boxes",
    slug: "gifts",
    description: "Beautifully designed gift packaging options, perfect for sending sweet wishes to family and corporate partners.",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-4",
    name: "Aamsotto & Dried",
    slug: "dried",
    description: "Traditional sun-dried mango bars (Aamsotto) and dehydrated mango slices.",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-5",
    name: "Pure Mango Pulp",
    slug: "pulp",
    description: "100% pure, natural, and preservative-free liquid mango pulp for smoothies and desserts.",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-6",
    name: "Seasonal Specials",
    slug: "seasonal",
    description: "Limited-time varieties that are available only during specific weeks of the harvest season.",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  }
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Rajshahi Himsagar",
    slug: "himsagar-mangoes",
    description: "The ultimate king of Bengali taste! Thin skin, fiberless flesh, and an unparalleled sweet aroma. Direct from our partner orchards in Kansat, Rajshahi.",
    price: 1200.00,
    sale_price: 999.00,
    stock: 150,
    category_id: "cat-2",
    images: ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"],
    is_featured: true,
    is_active: true,
    metadata: { origin_district: "Rajshahi", weight_options: ["5kg", "10kg"], badge: "King of Bengal" },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-2",
    name: "Rangpur Haribhanga",
    slug: "haribhanga-mangoes",
    description: "Highly popular variety known for its unique round shape, fleshy and fiberless nature, and distinctively rich, sweet taste.",
    price: 1400.00,
    sale_price: null,
    stock: 120,
    category_id: "cat-2",
    images: ["https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&auto=format&fit=crop&q=80"],
    is_featured: true,
    is_active: true,
    metadata: { origin_district: "Rangpur", weight_options: ["5kg", "10kg"], badge: "Fleshy & Fiberless" },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-3",
    name: "Chapainawabganj Lengra",
    slug: "lengra-mangoes",
    description: "An aromatic delight with a sweet and slightly tangy undertone. Exceptionally juicy with a very small seed inside.",
    price: 1100.00,
    sale_price: 950.00,
    stock: 200,
    category_id: "cat-2",
    images: ["https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&auto=format&fit=crop&q=80"],
    is_featured: true,
    is_active: true,
    metadata: { origin_district: "Chapainawabganj", weight_options: ["5kg", "10kg"], badge: "Aromatic Delight" },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-4",
    name: "Premium Amrapali",
    slug: "amrapali-mangoes",
    description: "Known for its intensely dark orange pulp, rich thickness, and honey-like sweetness. Sourced from high-yield organic orchards.",
    price: 1300.00,
    sale_price: 1150.00,
    stock: 180,
    category_id: "cat-2",
    images: ["https://images.unsplash.com/photo-1552474030-b3a5b5f04e2e?w=600&auto=format&fit=crop&q=80"],
    is_featured: true,
    is_active: true,
    metadata: { origin_district: "Chapai Nawabganj", weight_options: ["5kg", "10kg"], badge: "Intensely Sweet" },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-5",
    name: "Gopalbhog Select",
    slug: "gopalbhog-select",
    description: "One of the earliest varieties of the season. Renowned for its rich golden color and soft, velvety, sweet pulp.",
    price: 1000.00,
    sale_price: null,
    stock: 90,
    category_id: "cat-6",
    images: ["https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&auto=format&fit=crop&q=80"],
    is_featured: false,
    is_active: true,
    metadata: { origin_district: "Rajshahi", weight_options: ["5kg", "10kg"], badge: "Early Harvest" },
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
  {
    id: "prod-6",
    name: "Traditional Rajshahi Aamsotto",
    slug: "rajshahi-aamsotto",
    description: "Deliciously sweet sun-dried mango bar made from pure Himsagar pulp. 100% natural with no artificial preservatives or sugar added.",
    price: 600.00,
    sale_price: 550.00,
    stock: 300,
    category_id: "cat-4",
    images: ["https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&auto=format&fit=crop&q=80"],
    is_featured: false,
    is_active: true,
    metadata: { origin_district: "Rajshahi", weight_options: ["1kg", "2kg"], badge: "Sun Dried" },
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-7",
    name: "Pure Himsagar Pulp (1L)",
    slug: "himsagar-pulp-1l",
    description: "Freshly extracted and flash-frozen Himsagar pulp. Preserves the authentic flavor and aroma of fresh mangoes all year round.",
    price: 450.00,
    sale_price: 399.00,
    stock: 250,
    category_id: "cat-5",
    images: ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80"],
    is_featured: false,
    is_active: true,
    metadata: { origin_district: "Rajshahi", weight_options: ["1L"], badge: "100% Natural" },
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-8",
    name: "Corporate Gift Basket (15kg)",
    slug: "corporate-gift-basket",
    description: "An elegant wooden basket filled with an assortment of Himsagar and Lengra mangoes. Perfect corporate or festival gift.",
    price: 2500.00,
    sale_price: 2200.00,
    stock: 50,
    category_id: "cat-3",
    images: ["https://images.unsplash.com/photo-1552474030-b3a5b5f04e2e?w=600&auto=format&fit=crop&q=80"],
    is_featured: false,
    is_active: true,
    metadata: { origin_district: "Rajshahi", weight_options: ["15kg"], badge: "Gift Special" },
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  }
];

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
    const supabase = (await createClient()) as any;

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
      throw new Error("DB Error or missing table, trigger fallback");
    }
    if (!res.data || res.data.length === 0) {
      throw new Error("Table empty, trigger fallback");
    }
    return res;
  } catch (err) {
    // Return Fallback Mock Products
    let filtered = [...MOCK_PRODUCTS];

    if (options?.categorySlug) {
      filtered = filtered.filter(p => p.category?.slug === options.categorySlug);
    }
    if (options?.featured) {
      filtered = filtered.filter(p => p.is_featured);
    }
    if (options?.search) {
      const term = options.search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term));
    }

    // Sort
    if (options?.sortBy === "price_asc") {
      filtered.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    } else if (options?.sortBy === "price_desc") {
      filtered.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    } else if (options?.sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Newest
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Paginate
    const limit = options?.limit || 12;
    const offset = options?.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      data: paginated,
      count: filtered.length,
      error: null
    };
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
      throw new Error("Table missing or row not found");
    }
    if (!res.data) {
      throw new Error("Row not found");
    }
    return res;
  } catch (err) {
    const prod = MOCK_PRODUCTS.find(p => p.slug === slug);
    return {
      data: prod || null,
      error: prod ? null : { message: "Product not found" }
    };
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
      throw new Error("Table missing");
    }
    if (!res.data || res.data.length === 0) {
      throw new Error("Table empty");
    }
    return res;
  } catch (err) {
    const featured = MOCK_PRODUCTS.filter(p => p.is_featured).slice(0, limit);
    return {
      data: featured,
      error: null
    };
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
      throw new Error("Table missing");
    }
    if (!res.data || res.data.length === 0) {
      throw new Error("Table empty");
    }
    return res;
  } catch (err) {
    return {
      data: MOCK_CATEGORIES,
      error: null
    };
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
      throw new Error("Table missing or row not found");
    }
    if (!res.data) {
      throw new Error("Row not found");
    }
    return res;
  } catch (err) {
    const cat = MOCK_CATEGORIES.find(c => c.slug === slug);
    return {
      data: cat || null,
      error: cat ? null : { message: "Category not found" }
    };
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
      const stored = localStorage.getItem("mangodb-orders");
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
      const stored = localStorage.getItem("mangodb-orders");
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
      const stored = localStorage.getItem("mangodb-orders");
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
  const supabase = (await createClient()) as any;
  return supabase
    .from("profiles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
}

// ---- Review Queries ----

export async function getProductReviews(productId: string) {
  try {
    const supabase = (await createClient()) as any;
    const res = await supabase
      .from("reviews")
      .select("*, profile:profiles(full_name, avatar_url)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
      
    if (res.error && res.error.code === 'PGRST205') {
      throw new Error("Table missing");
    }
    return res;
  } catch (err) {
    // Return mock reviews
    const MOCK_REVIEWS: Review[] = [
      {
        id: "rev-1",
        user_id: "user-1",
        product_id: productId,
        rating: 5,
        comment: "Excellent quality mangoes! Fiberless and sweet as honey. Sourced very fresh. Fully satisfied.",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        profile: {
          id: "user-1",
          full_name: "Kamrul Hasan",
          email: "kamrul@gmail.com",
          phone: "01728394819",
          avatar_url: null,
          role: "user",
          created_at: "",
          updated_at: ""
        }
      },
      {
        id: "rev-2",
        user_id: "user-2",
        product_id: productId,
        rating: 4,
        comment: "Very aromatic lengra mangoes. The packaging was top grade. Recommended!",
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        profile: {
          id: "user-2",
          full_name: "Nusrat Jahan",
          email: "nusrat@gmail.com",
          phone: "01928394829",
          avatar_url: null,
          role: "user",
          created_at: "",
          updated_at: ""
        }
      }
    ];
    return {
      data: MOCK_REVIEWS,
      error: null
    };
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
      throw new Error("Table missing");
    }

    const totalRevenue =
      revenue.data?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;

    return {
      totalProducts: products.count || 0,
      totalOrders: orders.count || 0,
      totalUsers: users.count || 0,
      totalRevenue,
    };
  } catch (err) {
    // Mock admin stats
    let localOrders: Order[] = [];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mangodb-orders");
      if (stored) {
        try { localOrders = JSON.parse(stored); } catch (e) {}
      }
    }

    const totalRevenue = localOrders.reduce((sum, o) => sum + o.total, 0);

    return {
      totalProducts: MOCK_PRODUCTS.length,
      totalOrders: localOrders.length,
      totalUsers: 12,
      totalRevenue,
    };
  }
}
