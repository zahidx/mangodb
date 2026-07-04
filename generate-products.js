
const fs = require("fs");

const categories = [
  { id: "cat-1", name: "Mango", image: "/products/mango.png", baseProducts: ["Rajshahi Himsagar", "Premium Amrapali", "Chapainawabganj Lengra", "Gopalbhog Select", "Rangpur Haribhanga", "Fazli Mango", "Langra Premium", "Khirsapat Extra", "Ashwina Mango", "Guti Mango", "Mallika Premium", "Surja Dims Mango"] },
  { id: "cat-2", name: "Dates", image: "/products/dates.png", baseProducts: ["Premium Ajwa Dates", "Medjool Dates", "Mabroom Dates", "Sukkari Dates", "Safawi Dates", "Khudri Dates", "Zahidi Dates", "Deglet Noor", "Amber Dates", "Kalmi Dates", "Maryam Dates", "Barhi Dates"] },
  { id: "cat-3", name: "Ghee", image: "/products/ghee.png", baseProducts: ["Organic Cow Ghee", "Premium Buffalo Ghee", "Deshi Ghee 500g", "Homemade Ghee 1kg", "Aroma Ghee", "Village Style Ghee", "Pure Butter Ghee", "Clarified Butter Ghee", "Farm Fresh Ghee", "Traditional Ghee", "Golden Ghee", "Premium Deshi Ghee"] },
  { id: "cat-4", name: "Honey", image: "/products/honey.png", baseProducts: ["Sundarban Raw Honey", "Mustard Flower Honey", "Litchi Flower Honey", "Black Seed Honey", "Wild Forest Honey", "Natural Comb Honey", "Pure Acacia Honey", "Coriander Honey", "Eucalyptus Honey", "Organic Raw Honey", "Himalayan Honey", "Premium Royal Jelly"] },
  { id: "cat-5", name: "Nuts", image: "/products/nuts.png", baseProducts: ["Roasted Mixed Nuts", "Premium Almonds", "Cashew Nuts Whole", "Pistachio Roasted", "Walnut Kernels", "Macadamia Nuts", "Pecan Nuts", "Brazil Nuts", "Hazelnut Premium", "Pine Nuts", "Salted Peanuts", "Gourmet Trail Mix"] },
  { id: "cat-6", name: "Cold Drinks", image: "/products/juice.png", baseProducts: ["Fresh Mango Juice", "Litchi Drink", "Orange Cold Pressed", "Apple Fresh Juice", "Pomegranate Juice", "Guava Nectar", "Watermelon Cooler", "Mixed Fruit Juice", "Lemon Mint Crusher", "Pineapple Splash", "Grape Juice Premium", "Strawberry Shake"] }
];

let productsStr = "const MOCK_PRODUCTS: Product[] = [\n";
let prodId = 1;

categories.forEach((cat, catIndex) => {
  cat.baseProducts.forEach((prodName, i) => {
    const slug = prodName.toLowerCase().replace(/ /g, "-");
    const price = 500 + Math.floor(Math.random() * 1500);
    const sale_price = price - 100;
    
    productsStr += `  {
    id: "prod-${prodId++}",
    name: "${prodName}",
    slug: "${slug}",
    description: "Premium quality ${prodName} sourced perfectly for you. 100% natural and fresh.",
    price: ${price}.00,
    sale_price: ${sale_price}.00,
    stock: ${Math.floor(Math.random() * 200) + 50},
    category_id: "${cat.id}",
    images: ["${cat.image}"],
    is_featured: ${i < 4 ? "true" : "false"},
    is_active: true,
    tags: [],
    metadata: { origin_district: "Premium Source", weight_options: ["1kg", "2kg"], badge: "${i === 0 ? "Bestseller" : (i === 1 ? "New" : "Premium")}" },
    created_at: new Date(Date.now() - 86400000 * ${i}).toISOString(),
    updated_at: new Date().toISOString(),
    category: MOCK_CATEGORIES[${catIndex}],
  },\n`;
  });
});

productsStr += "];";

const queriesPath = "src/lib/supabase/queries.ts";
let content = fs.readFileSync(queriesPath, "utf-8");
content = content.replace(/const MOCK_PRODUCTS: Product\[\] = \[[\s\S]*?\];/, productsStr);
fs.writeFileSync(queriesPath, content);
console.log("Updated MOCK_PRODUCTS with 72 items successfully!");

