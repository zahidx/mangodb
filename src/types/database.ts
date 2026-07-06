// ===========================================
// MangoDB Market — Database Type Definitions
// ===========================================
// These types mirror the Supabase database schema

export type UserRole = "user" | "admin";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type BannerPosition = "hero" | "promo" | "offer";

// ---- Core Tables ----

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  dob: string | null;
  gender: string | null;
  country: string | null;
  city: string | null;
  role: UserRole;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  label: string;           // "1kg", "5kg", "10kg", "1L"
  sku: string;             // "HIMSAGAR-5KG"
  price: number;
  sale_price: number | null;
  stock: number;
  weight_kg: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  category_id: string | null;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  shipping_address: ShippingAddress | null;
  payment_status: PaymentStatus;
  payment_id: string | null;
  payment_method?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  // Joined fields
  product?: Product;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  // Joined fields
  product?: Product;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  images: string[] | null;
  is_approved: boolean;
  created_at: string;
  // Joined fields
  profile?: Profile;
  product?: Product;
}

// ---- Admin Extension Tables ----

export interface DeliveryZone {
  id: string;
  area_name: string;
  division: string;
  delivery_charge: number;
  is_active: boolean;
  estimated_days: number;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  position: BannerPosition;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  // Joined fields
  admin?: Profile;
}

// ---- Supporting Types ----

export interface ShippingAddress {
  full_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  country: string;
  state: string;
  city: string;
  area: string;
  postal_code: string | null;
  street_address: string;
  apartment: string | null;
  label: "Home" | "Office" | "Other";
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Supabase Database Type (for typed client) ----

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id" | "created_at">>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at" | "updated_at" | "category">;
        Update: Partial<
          Omit<Product, "id" | "created_at" | "category">
        >;
      };
      orders: {
        Row: Order;
        Insert: Omit<
          Order,
          "id" | "created_at" | "updated_at" | "profile" | "order_items"
        >;
        Update: Partial<
          Omit<Order, "id" | "created_at" | "profile" | "order_items">
        >;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id" | "product">;
        Update: Partial<Omit<OrderItem, "id" | "product">>;
      };
      cart_items: {
        Row: CartItem;
        Insert: Omit<CartItem, "id" | "created_at" | "product">;
        Update: Partial<Omit<CartItem, "id" | "created_at" | "product">>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, "id" | "created_at" | "profile" | "product">;
        Update: Partial<
          Omit<Review, "id" | "created_at" | "profile" | "product">
        >;
      };
      delivery_zones: {
        Row: DeliveryZone;
        Insert: Omit<DeliveryZone, "id" | "created_at">;
        Update: Partial<Omit<DeliveryZone, "id" | "created_at">>;
      };
      banners: {
        Row: Banner;
        Insert: Omit<Banner, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Banner, "id" | "created_at">>;
      };
      site_settings: {
        Row: SiteSetting;
        Insert: Omit<SiteSetting, "id" | "updated_at">;
        Update: Partial<Omit<SiteSetting, "id">>;
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, "id" | "created_at" | "admin">;
        Update: never;
      };
      user_addresses: {
        Row: UserAddress;
        Insert: Omit<UserAddress, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<UserAddress, "id" | "created_at" | "user_id">>;
      };
    };
  };
}
