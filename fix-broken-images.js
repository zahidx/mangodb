
const fs = require("fs");

const queriesPath = "src/lib/supabase/queries.ts";
let content = fs.readFileSync(queriesPath, "utf-8");

// We need to replace the local broken paths with direct Unsplash URLs
const fixMap = {
  "/products/honey_1.png": "https://images.unsplash.com/photo-1587049352851-8d4e891347ba?w=600&q=80",
  "/products/honey_2.png": "https://images.unsplash.com/photo-1558988636-eb2913e2f5b5?w=600&q=80",
  "/products/honey_3.png": "https://images.unsplash.com/photo-1574558561138-16a3bc50b3f5?w=600&q=80",
  "/products/nuts_1.png": "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=600&q=80",
  "/products/nuts_2.png": "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=600&q=80",
  "/products/nuts_3.png": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80",
  "/products/juice_1.png": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80",
  "/products/juice_2.png": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&q=80",
  "/products/juice_3.png": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
};

for (const [localPath, unsplashUrl] of Object.entries(fixMap)) {
  content = content.replaceAll(`"${localPath}"`, `"${unsplashUrl}"`);
}

fs.writeFileSync(queriesPath, content);
console.log("Fixed broken images by replacing with Unsplash URLs directly.");

