
const fs = require("fs");

const queriesPath = "src/lib/supabase/queries.ts";
let content = fs.readFileSync(queriesPath, "utf-8");

const fixMap = {
  "https://images.unsplash.com/photo-1587049352851-8d4e891347ba?w=600&q=80": "/products/honey.png",
  "https://images.unsplash.com/photo-1558988636-eb2913e2f5b5?w=600&q=80": "/products/honey.png",
  "https://images.unsplash.com/photo-1574558561138-16a3bc50b3f5?w=600&q=80": "/products/honey.png"
};

for (const [unsplashUrl, localPath] of Object.entries(fixMap)) {
  content = content.replaceAll(unsplashUrl, localPath);
}

fs.writeFileSync(queriesPath, content);
console.log("Reverted Honey products to all use the single local /products/honey.png image.");

