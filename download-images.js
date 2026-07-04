
const fs = require("fs");
const path = require("path");
const https = require("https");

const publicDir = path.join(__dirname, "public", "products");

const downloads = [
  // Honey
  { url: "https://images.unsplash.com/photo-1587049352851-8d4e891347ba?w=600&q=80", name: "honey_1.png" },
  { url: "https://images.unsplash.com/photo-1558988636-eb2913e2f5b5?w=600&q=80", name: "honey_2.png" },
  { url: "https://images.unsplash.com/photo-1574558561138-16a3bc50b3f5?w=600&q=80", name: "honey_3.png" },
  
  // Nuts
  { url: "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=600&q=80", name: "nuts_1.png" },
  { url: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=600&q=80", name: "nuts_2.png" },
  { url: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80", name: "nuts_3.png" },
  
  // Juice (Cold Drinks)
  { url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80", name: "juice_1.png" },
  { url: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&q=80", name: "juice_2.png" },
  { url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80", name: "juice_3.png" }
];

async function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const item of downloads) {
    const dest = path.join(publicDir, item.name);
    console.log("Downloading", item.name);
    await downloadImage(item.url, dest);
  }
  
  // Update queries.ts
  const queriesPath = "src/lib/supabase/queries.ts";
  let content = fs.readFileSync(queriesPath, "utf-8");

  const imageMap = {
    mango: ["/products/mango_1_1783197907406.png", "/products/mango_2_1783197916690.png", "/products/mango_3_1783197926018.png", "/products/mango_4_1783197934404.png"],
    dates: ["/products/dates_1_1783197943645.png", "/products/dates_2_1783197952855.png", "/products/dates_3_1783197962139.png", "/products/dates_4_1783197971651.png"],
    ghee: ["/products/ghee_1_1783197980631.png", "/products/ghee_2_1783197989967.png", "/products/ghee_3_1783198004610.png"],
    honey: ["/products/honey.png", "/products/honey_1.png", "/products/honey_2.png", "/products/honey_3.png"],
    nuts: ["/products/nuts.png", "/products/nuts_1.png", "/products/nuts_2.png", "/products/nuts_3.png"],
    "cold drinks": ["/products/juice.png", "/products/juice_1.png", "/products/juice_2.png", "/products/juice_3.png"]
  };

  const categories = [
    { id: "cat-1", name: "Mango", key: "mango", baseProducts: ["Rajshahi Himsagar", "Premium Amrapali", "Chapainawabganj Lengra", "Gopalbhog Select", "Rangpur Haribhanga", "Fazli Mango", "Langra Premium", "Khirsapat Extra", "Ashwina Mango", "Guti Mango", "Mallika Premium", "Surja Dims Mango"] },
    { id: "cat-2", name: "Dates", key: "dates", baseProducts: ["Premium Ajwa Dates", "Medjool Dates", "Mabroom Dates", "Sukkari Dates", "Safawi Dates", "Khudri Dates", "Zahidi Dates", "Deglet Noor", "Amber Dates", "Kalmi Dates", "Maryam Dates", "Barhi Dates"] },
    { id: "cat-3", name: "Ghee", key: "ghee", baseProducts: ["Organic Cow Ghee", "Premium Buffalo Ghee", "Deshi Ghee 500g", "Homemade Ghee 1kg", "Aroma Ghee", "Village Style Ghee", "Pure Butter Ghee", "Clarified Butter Ghee", "Farm Fresh Ghee", "Traditional Ghee", "Golden Ghee", "Premium Deshi Ghee"] },
    { id: "cat-4", name: "Honey", key: "honey", baseProducts: ["Sundarban Raw Honey", "Mustard Flower Honey", "Litchi Flower Honey", "Black Seed Honey", "Wild Forest Honey", "Natural Comb Honey", "Pure Acacia Honey", "Coriander Honey", "Eucalyptus Honey", "Organic Raw Honey", "Himalayan Honey", "Premium Royal Jelly"] },
    { id: "cat-5", name: "Nuts", key: "nuts", baseProducts: ["Roasted Mixed Nuts", "Premium Almonds", "Cashew Nuts Whole", "Pistachio Roasted", "Walnut Kernels", "Macadamia Nuts", "Pecan Nuts", "Brazil Nuts", "Hazelnut Premium", "Pine Nuts", "Salted Peanuts", "Gourmet Trail Mix"] },
    { id: "cat-6", name: "Cold Drinks", key: "cold drinks", baseProducts: ["Fresh Mango Juice", "Litchi Drink", "Orange Cold Pressed", "Apple Fresh Juice", "Pomegranate Juice", "Guava Nectar", "Watermelon Cooler", "Mixed Fruit Juice", "Lemon Mint Crusher", "Pineapple Splash", "Grape Juice Premium", "Strawberry Shake"] }
  ];

  let productsStr = "const MOCK_PRODUCTS: Product[] = [\n";
  let prodId = 1;

  categories.forEach((cat, catIndex) => {
    const imagesForCat = imageMap[cat.key];
    cat.baseProducts.forEach((prodName, i) => {
      const slug = prodName.toLowerCase().replace(/ /g, "-");
      const price = 500 + Math.floor(Math.random() * 1500);
      const sale_price = price - 100;
      
      const imageUrl = imagesForCat[i % imagesForCat.length];
      
      productsStr += `  {
    id: "prod-${prodId++}",
    name: "${prodName}",
    slug: "${slug}",
    description: "Premium quality ${prodName} sourced perfectly for you. 100% natural and fresh.",
    price: ${price}.00,
    sale_price: ${sale_price}.00,
    stock: ${Math.floor(Math.random() * 200) + 50},
    category_id: "${cat.id}",
    images: ["${imageUrl}"],
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

  content = content.replace(/const MOCK_PRODUCTS: Product\[\] = \[[\s\S]*?\];/, productsStr);
  fs.writeFileSync(queriesPath, content);
  console.log("Updated MOCK_PRODUCTS with varied local images for Honey and Nuts!");
}

run();

