// ===========================================
// Supabase Database Query Helpers (Hybrid Fallback Edition)
// ===========================================
// Reusable query functions for all database operations with mock fallbacks

import { createClient } from "@/lib/supabase/client";
import type {
    Category,
    Order,
    Product,
    Profile,
    Review
} from "@/types/database";

// ---- Mock Data Fallbacks ----

const MOCK_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Mango",
    slug: "mango",
    description: "100% chemical-free organic mangoes sourced directly from certified orchards.",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-2",
    name: "Dates",
    slug: "dates",
    description: "High-quality, naturally sweet dates sourced from the finest farms.",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-3",
    name: "Ghee",
    slug: "ghee",
    description: "Authentic, aromatic, and 100% pure homemade ghee.",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-4",
    name: "Honey",
    slug: "honey",
    description: "Raw, unpasteurized natural honey collected directly from the hive.",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-5",
    name: "Nuts",
    slug: "nuts",
    description: "Premium roasted mixed nuts packed with protein and crunch.",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-6",
    name: "Cold Drinks",
    slug: "cold-drinks",
    description: "Refreshing cold beverages and artisan juices.",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  }
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Rajshahi Himsagar",
    slug: "rajshahi-himsagar",
    description: "Premium quality Rajshahi Himsagar sourced perfectly for you. 100% natural and fresh.",
    price: 1184.00,
    sale_price: 1084.00,
    stock: 59,
    category_id: "cat-1",
    images: ["/products/mango_1_1783197907406.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Bestseller" },
    created_at: new Date(Date.now() - 86400000 * 0).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: "prod-2",
    name: "Premium Amrapali",
    slug: "premium-amrapali",
    description: "Premium quality Premium Amrapali sourced perfectly for you. 100% natural and fresh.",
    price: 1763.00,
    sale_price: 1663.00,
    stock: 110,
    category_id: "cat-1",
    images: ["/products/mango_2_1783197916690.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "New" },
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: "prod-3",
    name: "Chapainawabganj Lengra",
    slug: "chapainawabganj-lengra",
    description: "Premium quality Chapainawabganj Lengra sourced perfectly for you. 100% natural and fresh.",
    price: 1422.00,
    sale_price: 1322.00,
    stock: 95,
    category_id: "cat-1",
    images: ["/products/mango_3_1783197926018.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: "prod-4",
    name: "Gopalbhog Select",
    slug: "gopalbhog-select",
    description: "Premium quality Gopalbhog Select sourced perfectly for you. 100% natural and fresh.",
    price: 1223.00,
    sale_price: 1123.00,
    stock: 228,
    category_id: "cat-1",
    images: ["/products/mango_4_1783197934404.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: "prod-5",
    name: "Rangpur Haribhanga",
    slug: "rangpur-haribhanga",
    description: "Premium quality Rangpur Haribhanga sourced perfectly for you. 100% natural and fresh.",
    price: 1010.00,
    sale_price: 910.00,
    stock: 214,
    category_id: "cat-1",
    images: ["/products/mango_1_1783197907406.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: "prod-6",
    name: "Fazli Mango",
    slug: "fazli-mango",
    description: "Premium quality Fazli Mango sourced perfectly for you. 100% natural and fresh.",
    price: 1540.00,
    sale_price: 1440.00,
    stock: 143,
    category_id: "cat-1",
    images: ["/products/mango_2_1783197916690.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: "prod-7",
    name: "Langra Premium",
    slug: "langra-premium",
    description: "Premium quality Langra Premium sourced perfectly for you. 100% natural and fresh.",
    price: 1378.00,
    sale_price: 1278.00,
    stock: 126,
    category_id: "cat-1",
    images: ["/products/mango_3_1783197926018.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: "prod-8",
    name: "Khirsapat Extra",
    slug: "khirsapat-extra",
    description: "Premium quality Khirsapat Extra sourced perfectly for you. 100% natural and fresh.",
    price: 1349.00,
    sale_price: 1249.00,
    stock: 75,
    category_id: "cat-1",
    images: ["/products/mango_4_1783197934404.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: "prod-9",
    name: "Ashwina Mango",
    slug: "ashwina-mango",
    description: "Premium quality Ashwina Mango sourced perfectly for you. 100% natural and fresh.",
    price: 1473.00,
    sale_price: 1373.00,
    stock: 93,
    category_id: "cat-1",
    images: ["/products/mango_1_1783197907406.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: "prod-10",
    name: "Guti Mango",
    slug: "guti-mango",
    description: "Premium quality Guti Mango sourced perfectly for you. 100% natural and fresh.",
    price: 1955.00,
    sale_price: 1855.00,
    stock: 171,
    category_id: "cat-1",
    images: ["/products/mango_2_1783197916690.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: "prod-11",
    name: "Mallika Premium",
    slug: "mallika-premium",
    description: "Premium quality Mallika Premium sourced perfectly for you. 100% natural and fresh.",
    price: 1718.00,
    sale_price: 1618.00,
    stock: 198,
    category_id: "cat-1",
    images: ["/products/mango_3_1783197926018.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: "prod-12",
    name: "Surja Dims Mango",
    slug: "surja-dims-mango",
    description: "Premium quality Surja Dims Mango sourced perfectly for you. 100% natural and fresh.",
    price: 1867.00,
    sale_price: 1767.00,
    stock: 193,
    category_id: "cat-1",
    images: ["/products/mango_4_1783197934404.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[0],
  },
  {
    id: "prod-13",
    name: "Premium Ajwa Dates",
    slug: "premium-ajwa-dates",
    description: "Premium quality Premium Ajwa Dates sourced perfectly for you. 100% natural and fresh.",
    price: 911.00,
    sale_price: 811.00,
    stock: 187,
    category_id: "cat-2",
    images: ["/products/dates_1_1783197943645.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Bestseller" },
    created_at: new Date(Date.now() - 86400000 * 0).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-14",
    name: "Medjool Dates",
    slug: "medjool-dates",
    description: "Premium quality Medjool Dates sourced perfectly for you. 100% natural and fresh.",
    price: 1443.00,
    sale_price: 1343.00,
    stock: 125,
    category_id: "cat-2",
    images: ["/products/dates_2_1783197952855.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "New" },
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-15",
    name: "Mabroom Dates",
    slug: "mabroom-dates",
    description: "Premium quality Mabroom Dates sourced perfectly for you. 100% natural and fresh.",
    price: 1420.00,
    sale_price: 1320.00,
    stock: 137,
    category_id: "cat-2",
    images: ["/products/dates_3_1783197962139.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-16",
    name: "Sukkari Dates",
    slug: "sukkari-dates",
    description: "Premium quality Sukkari Dates sourced perfectly for you. 100% natural and fresh.",
    price: 586.00,
    sale_price: 486.00,
    stock: 218,
    category_id: "cat-2",
    images: ["/products/dates_4_1783197971651.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-17",
    name: "Safawi Dates",
    slug: "safawi-dates",
    description: "Premium quality Safawi Dates sourced perfectly for you. 100% natural and fresh.",
    price: 1890.00,
    sale_price: 1790.00,
    stock: 195,
    category_id: "cat-2",
    images: ["/products/dates_1_1783197943645.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-18",
    name: "Khudri Dates",
    slug: "khudri-dates",
    description: "Premium quality Khudri Dates sourced perfectly for you. 100% natural and fresh.",
    price: 876.00,
    sale_price: 776.00,
    stock: 98,
    category_id: "cat-2",
    images: ["/products/dates_2_1783197952855.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-19",
    name: "Zahidi Dates",
    slug: "zahidi-dates",
    description: "Premium quality Zahidi Dates sourced perfectly for you. 100% natural and fresh.",
    price: 1277.00,
    sale_price: 1177.00,
    stock: 242,
    category_id: "cat-2",
    images: ["/products/dates_3_1783197962139.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-20",
    name: "Deglet Noor",
    slug: "deglet-noor",
    description: "Premium quality Deglet Noor sourced perfectly for you. 100% natural and fresh.",
    price: 804.00,
    sale_price: 704.00,
    stock: 216,
    category_id: "cat-2",
    images: ["/products/dates_4_1783197971651.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-21",
    name: "Amber Dates",
    slug: "amber-dates",
    description: "Premium quality Amber Dates sourced perfectly for you. 100% natural and fresh.",
    price: 573.00,
    sale_price: 473.00,
    stock: 202,
    category_id: "cat-2",
    images: ["/products/dates_1_1783197943645.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-22",
    name: "Kalmi Dates",
    slug: "kalmi-dates",
    description: "Premium quality Kalmi Dates sourced perfectly for you. 100% natural and fresh.",
    price: 1404.00,
    sale_price: 1304.00,
    stock: 62,
    category_id: "cat-2",
    images: ["/products/dates_2_1783197952855.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-23",
    name: "Maryam Dates",
    slug: "maryam-dates",
    description: "Premium quality Maryam Dates sourced perfectly for you. 100% natural and fresh.",
    price: 1804.00,
    sale_price: 1704.00,
    stock: 67,
    category_id: "cat-2",
    images: ["/products/dates_3_1783197962139.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-24",
    name: "Barhi Dates",
    slug: "barhi-dates",
    description: "Premium quality Barhi Dates sourced perfectly for you. 100% natural and fresh.",
    price: 542.00,
    sale_price: 442.00,
    stock: 145,
    category_id: "cat-2",
    images: ["/products/dates_4_1783197971651.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[1],
  },
  {
    id: "prod-25",
    name: "Organic Cow Ghee",
    slug: "organic-cow-ghee",
    description: "Premium quality Organic Cow Ghee sourced perfectly for you. 100% natural and fresh.",
    price: 869.00,
    sale_price: 769.00,
    stock: 230,
    category_id: "cat-3",
    images: ["/products/ghee_1_1783197980631.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Bestseller" },
    created_at: new Date(Date.now() - 86400000 * 0).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: "prod-26",
    name: "Premium Buffalo Ghee",
    slug: "premium-buffalo-ghee",
    description: "Premium quality Premium Buffalo Ghee sourced perfectly for you. 100% natural and fresh.",
    price: 1782.00,
    sale_price: 1682.00,
    stock: 225,
    category_id: "cat-3",
    images: ["/products/ghee_2_1783197989967.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "New" },
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: "prod-27",
    name: "Deshi Ghee 500g",
    slug: "deshi-ghee-500g",
    description: "Premium quality Deshi Ghee 500g sourced perfectly for you. 100% natural and fresh.",
    price: 1686.00,
    sale_price: 1586.00,
    stock: 189,
    category_id: "cat-3",
    images: ["/products/ghee_3_1783198004610.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: "prod-28",
    name: "Homemade Ghee 1kg",
    slug: "homemade-ghee-1kg",
    description: "Premium quality Homemade Ghee 1kg sourced perfectly for you. 100% natural and fresh.",
    price: 1991.00,
    sale_price: 1891.00,
    stock: 235,
    category_id: "cat-3",
    images: ["/products/ghee_1_1783197980631.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: "prod-29",
    name: "Aroma Ghee",
    slug: "aroma-ghee",
    description: "Premium quality Aroma Ghee sourced perfectly for you. 100% natural and fresh.",
    price: 1056.00,
    sale_price: 956.00,
    stock: 74,
    category_id: "cat-3",
    images: ["/products/ghee_2_1783197989967.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: "prod-30",
    name: "Village Style Ghee",
    slug: "village-style-ghee",
    description: "Premium quality Village Style Ghee sourced perfectly for you. 100% natural and fresh.",
    price: 690.00,
    sale_price: 590.00,
    stock: 126,
    category_id: "cat-3",
    images: ["/products/ghee_3_1783198004610.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: "prod-31",
    name: "Pure Butter Ghee",
    slug: "pure-butter-ghee",
    description: "Premium quality Pure Butter Ghee sourced perfectly for you. 100% natural and fresh.",
    price: 1626.00,
    sale_price: 1526.00,
    stock: 98,
    category_id: "cat-3",
    images: ["/products/ghee_1_1783197980631.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: "prod-32",
    name: "Clarified Butter Ghee",
    slug: "clarified-butter-ghee",
    description: "Premium quality Clarified Butter Ghee sourced perfectly for you. 100% natural and fresh.",
    price: 1445.00,
    sale_price: 1345.00,
    stock: 160,
    category_id: "cat-3",
    images: ["/products/ghee_2_1783197989967.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: "prod-33",
    name: "Farm Fresh Ghee",
    slug: "farm-fresh-ghee",
    description: "Premium quality Farm Fresh Ghee sourced perfectly for you. 100% natural and fresh.",
    price: 1315.00,
    sale_price: 1215.00,
    stock: 65,
    category_id: "cat-3",
    images: ["/products/ghee_3_1783198004610.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: "prod-34",
    name: "Traditional Ghee",
    slug: "traditional-ghee",
    description: "Premium quality Traditional Ghee sourced perfectly for you. 100% natural and fresh.",
    price: 537.00,
    sale_price: 437.00,
    stock: 165,
    category_id: "cat-3",
    images: ["/products/ghee_1_1783197980631.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: "prod-35",
    name: "Golden Ghee",
    slug: "golden-ghee",
    description: "Premium quality Golden Ghee sourced perfectly for you. 100% natural and fresh.",
    price: 1003.00,
    sale_price: 903.00,
    stock: 203,
    category_id: "cat-3",
    images: ["/products/ghee_2_1783197989967.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: "prod-36",
    name: "Premium Deshi Ghee",
    slug: "premium-deshi-ghee",
    description: "Premium quality Premium Deshi Ghee sourced perfectly for you. 100% natural and fresh.",
    price: 575.00,
    sale_price: 475.00,
    stock: 65,
    category_id: "cat-3",
    images: ["/products/ghee_3_1783198004610.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[2],
  },
  {
    id: "prod-37",
    name: "Sundarban Raw Honey",
    slug: "sundarban-raw-honey",
    description: "Premium quality Sundarban Raw Honey sourced perfectly for you. 100% natural and fresh.",
    price: 614.00,
    sale_price: 514.00,
    stock: 207,
    category_id: "cat-4",
    images: ["/products/honey.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Bestseller" },
    created_at: new Date(Date.now() - 86400000 * 0).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-38",
    name: "Mustard Flower Honey",
    slug: "mustard-flower-honey",
    description: "Premium quality Mustard Flower Honey sourced perfectly for you. 100% natural and fresh.",
    price: 1071.00,
    sale_price: 971.00,
    stock: 236,
    category_id: "cat-4",
    images: ["/products/honey.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "New" },
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-39",
    name: "Litchi Flower Honey",
    slug: "litchi-flower-honey",
    description: "Premium quality Litchi Flower Honey sourced perfectly for you. 100% natural and fresh.",
    price: 1800.00,
    sale_price: 1700.00,
    stock: 228,
    category_id: "cat-4",
    images: ["/products/honey.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-40",
    name: "Black Seed Honey",
    slug: "black-seed-honey",
    description: "Premium quality Black Seed Honey sourced perfectly for you. 100% natural and fresh.",
    price: 1919.00,
    sale_price: 1819.00,
    stock: 174,
    category_id: "cat-4",
    images: ["/products/honey.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-41",
    name: "Wild Forest Honey",
    slug: "wild-forest-honey",
    description: "Premium quality Wild Forest Honey sourced perfectly for you. 100% natural and fresh.",
    price: 1521.00,
    sale_price: 1421.00,
    stock: 76,
    category_id: "cat-4",
    images: ["/products/honey.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-42",
    name: "Natural Comb Honey",
    slug: "natural-comb-honey",
    description: "Premium quality Natural Comb Honey sourced perfectly for you. 100% natural and fresh.",
    price: 1441.00,
    sale_price: 1341.00,
    stock: 119,
    category_id: "cat-4",
    images: ["/products/honey.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-43",
    name: "Pure Acacia Honey",
    slug: "pure-acacia-honey",
    description: "Premium quality Pure Acacia Honey sourced perfectly for you. 100% natural and fresh.",
    price: 1230.00,
    sale_price: 1130.00,
    stock: 86,
    category_id: "cat-4",
    images: ["/products/honey.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-44",
    name: "Coriander Honey",
    slug: "coriander-honey",
    description: "Premium quality Coriander Honey sourced perfectly for you. 100% natural and fresh.",
    price: 1051.00,
    sale_price: 951.00,
    stock: 153,
    category_id: "cat-4",
    images: ["/products/honey.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-45",
    name: "Eucalyptus Honey",
    slug: "eucalyptus-honey",
    description: "Premium quality Eucalyptus Honey sourced perfectly for you. 100% natural and fresh.",
    price: 1512.00,
    sale_price: 1412.00,
    stock: 109,
    category_id: "cat-4",
    images: ["/products/honey.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-46",
    name: "Organic Raw Honey",
    slug: "organic-raw-honey",
    description: "Premium quality Organic Raw Honey sourced perfectly for you. 100% natural and fresh.",
    price: 986.00,
    sale_price: 886.00,
    stock: 139,
    category_id: "cat-4",
    images: ["/products/honey.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-47",
    name: "Himalayan Honey",
    slug: "himalayan-honey",
    description: "Premium quality Himalayan Honey sourced perfectly for you. 100% natural and fresh.",
    price: 1805.00,
    sale_price: 1705.00,
    stock: 101,
    category_id: "cat-4",
    images: ["/products/honey.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-48",
    name: "Premium Royal Jelly",
    slug: "premium-royal-jelly",
    description: "Premium quality Premium Royal Jelly sourced perfectly for you. 100% natural and fresh.",
    price: 1442.00,
    sale_price: 1342.00,
    stock: 231,
    category_id: "cat-4",
    images: ["/products/honey.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[3],
  },
  {
    id: "prod-49",
    name: "Roasted Mixed Nuts",
    slug: "roasted-mixed-nuts",
    description: "Premium quality Roasted Mixed Nuts sourced perfectly for you. 100% natural and fresh.",
    price: 1722.00,
    sale_price: 1622.00,
    stock: 126,
    category_id: "cat-5",
    images: ["/products/nuts.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Bestseller" },
    created_at: new Date(Date.now() - 86400000 * 0).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-50",
    name: "Premium Almonds",
    slug: "premium-almonds",
    description: "Premium quality Premium Almonds sourced perfectly for you. 100% natural and fresh.",
    price: 1342.00,
    sale_price: 1242.00,
    stock: 142,
    category_id: "cat-5",
    images: ["https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=600&q=80"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "New" },
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-51",
    name: "Cashew Nuts Whole",
    slug: "cashew-nuts-whole",
    description: "Premium quality Cashew Nuts Whole sourced perfectly for you. 100% natural and fresh.",
    price: 754.00,
    sale_price: 654.00,
    stock: 52,
    category_id: "cat-5",
    images: ["https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=600&q=80"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-52",
    name: "Pistachio Roasted",
    slug: "pistachio-roasted",
    description: "Premium quality Pistachio Roasted sourced perfectly for you. 100% natural and fresh.",
    price: 1976.00,
    sale_price: 1876.00,
    stock: 76,
    category_id: "cat-5",
    images: ["https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-53",
    name: "Walnut Kernels",
    slug: "walnut-kernels",
    description: "Premium quality Walnut Kernels sourced perfectly for you. 100% natural and fresh.",
    price: 1370.00,
    sale_price: 1270.00,
    stock: 88,
    category_id: "cat-5",
    images: ["/products/nuts.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-54",
    name: "Macadamia Nuts",
    slug: "macadamia-nuts",
    description: "Premium quality Macadamia Nuts sourced perfectly for you. 100% natural and fresh.",
    price: 647.00,
    sale_price: 547.00,
    stock: 59,
    category_id: "cat-5",
    images: ["https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=600&q=80"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-55",
    name: "Pecan Nuts",
    slug: "pecan-nuts",
    description: "Premium quality Pecan Nuts sourced perfectly for you. 100% natural and fresh.",
    price: 1942.00,
    sale_price: 1842.00,
    stock: 240,
    category_id: "cat-5",
    images: ["https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=600&q=80"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-56",
    name: "Brazil Nuts",
    slug: "brazil-nuts",
    description: "Premium quality Brazil Nuts sourced perfectly for you. 100% natural and fresh.",
    price: 1655.00,
    sale_price: 1555.00,
    stock: 152,
    category_id: "cat-5",
    images: ["https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-57",
    name: "Hazelnut Premium",
    slug: "hazelnut-premium",
    description: "Premium quality Hazelnut Premium sourced perfectly for you. 100% natural and fresh.",
    price: 827.00,
    sale_price: 727.00,
    stock: 65,
    category_id: "cat-5",
    images: ["/products/nuts.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-58",
    name: "Pine Nuts",
    slug: "pine-nuts",
    description: "Premium quality Pine Nuts sourced perfectly for you. 100% natural and fresh.",
    price: 1830.00,
    sale_price: 1730.00,
    stock: 132,
    category_id: "cat-5",
    images: ["https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=600&q=80"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-59",
    name: "Salted Peanuts",
    slug: "salted-peanuts",
    description: "Premium quality Salted Peanuts sourced perfectly for you. 100% natural and fresh.",
    price: 1253.00,
    sale_price: 1153.00,
    stock: 221,
    category_id: "cat-5",
    images: ["https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=600&q=80"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-60",
    name: "Gourmet Trail Mix",
    slug: "gourmet-trail-mix",
    description: "Premium quality Gourmet Trail Mix sourced perfectly for you. 100% natural and fresh.",
    price: 1771.00,
    sale_price: 1671.00,
    stock: 129,
    category_id: "cat-5",
    images: ["https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[4],
  },
  {
    id: "prod-61",
    name: "Fresh Mango Juice",
    slug: "fresh-mango-juice",
    description: "Premium quality Fresh Mango Juice sourced perfectly for you. 100% natural and fresh.",
    price: 547.00,
    sale_price: 447.00,
    stock: 174,
    category_id: "cat-6",
    images: ["/products/juice.png"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Bestseller" },
    created_at: new Date(Date.now() - 86400000 * 0).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
  {
    id: "prod-62",
    name: "Litchi Drink",
    slug: "litchi-drink",
    description: "Premium quality Litchi Drink sourced perfectly for you. 100% natural and fresh.",
    price: 559.00,
    sale_price: 459.00,
    stock: 154,
    category_id: "cat-6",
    images: ["https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "New" },
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
  {
    id: "prod-63",
    name: "Orange Cold Pressed",
    slug: "orange-cold-pressed",
    description: "Premium quality Orange Cold Pressed sourced perfectly for you. 100% natural and fresh.",
    price: 1875.00,
    sale_price: 1775.00,
    stock: 69,
    category_id: "cat-6",
    images: ["https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&q=80"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
  {
    id: "prod-64",
    name: "Apple Fresh Juice",
    slug: "apple-fresh-juice",
    description: "Premium quality Apple Fresh Juice sourced perfectly for you. 100% natural and fresh.",
    price: 791.00,
    sale_price: 691.00,
    stock: 97,
    category_id: "cat-6",
    images: ["https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"],
    is_featured: true,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
  {
    id: "prod-65",
    name: "Pomegranate Juice",
    slug: "pomegranate-juice",
    description: "Premium quality Pomegranate Juice sourced perfectly for you. 100% natural and fresh.",
    price: 1929.00,
    sale_price: 1829.00,
    stock: 58,
    category_id: "cat-6",
    images: ["/products/juice.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
  {
    id: "prod-66",
    name: "Guava Nectar",
    slug: "guava-nectar",
    description: "Premium quality Guava Nectar sourced perfectly for you. 100% natural and fresh.",
    price: 867.00,
    sale_price: 767.00,
    stock: 78,
    category_id: "cat-6",
    images: ["https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
  {
    id: "prod-67",
    name: "Watermelon Cooler",
    slug: "watermelon-cooler",
    description: "Premium quality Watermelon Cooler sourced perfectly for you. 100% natural and fresh.",
    price: 1795.00,
    sale_price: 1695.00,
    stock: 135,
    category_id: "cat-6",
    images: ["https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&q=80"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
  {
    id: "prod-68",
    name: "Mixed Fruit Juice",
    slug: "mixed-fruit-juice",
    description: "Premium quality Mixed Fruit Juice sourced perfectly for you. 100% natural and fresh.",
    price: 1607.00,
    sale_price: 1507.00,
    stock: 83,
    category_id: "cat-6",
    images: ["https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
  {
    id: "prod-69",
    name: "Lemon Mint Crusher",
    slug: "lemon-mint-crusher",
    description: "Premium quality Lemon Mint Crusher sourced perfectly for you. 100% natural and fresh.",
    price: 1514.00,
    sale_price: 1414.00,
    stock: 148,
    category_id: "cat-6",
    images: ["/products/juice.png"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
  {
    id: "prod-70",
    name: "Pineapple Splash",
    slug: "pineapple-splash",
    description: "Premium quality Pineapple Splash sourced perfectly for you. 100% natural and fresh.",
    price: 950.00,
    sale_price: 850.00,
    stock: 238,
    category_id: "cat-6",
    images: ["https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
  {
    id: "prod-71",
    name: "Grape Juice Premium",
    slug: "grape-juice-premium",
    description: "Premium quality Grape Juice Premium sourced perfectly for you. 100% natural and fresh.",
    price: 931.00,
    sale_price: 831.00,
    stock: 243,
    category_id: "cat-6",
    images: ["https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&q=80"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
  {
    id: "prod-72",
    name: "Strawberry Shake",
    slug: "strawberry-shake",
    description: "Premium quality Strawberry Shake sourced perfectly for you. 100% natural and fresh.",
    price: 1229.00,
    sale_price: 1129.00,
    stock: 89,
    category_id: "cat-6",
    images: ["https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"],
    is_featured: false,
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "Premium" },
    created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[5],
  },
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
        is_approved: true,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        profile: {
          id: "user-1",
          full_name: "Kamrul Hasan",
          email: "kamrul@gmail.com",
          phone: "01728394819",
          avatar_url: null,
          role: "user",
          dob: null,
          gender: null,
          country: null,
          city: null,
          is_blocked: false,
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
        is_approved: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        profile: {
          id: "user-2",
          full_name: "Nusrat Jahan",
          email: "nusrat@gmail.com",
          phone: "01928394829",
          avatar_url: null,
          role: "user",
          dob: null,
          gender: null,
          country: null,
          city: null,
          is_blocked: false,
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
