// ===========================================
// Public Delivery Zones API — used at checkout
// ===========================================
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey) as any;
}

export async function GET(req: Request) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city")?.toLowerCase().trim();

    const { data, error } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("is_active", true);

    if (error) {
      return NextResponse.json({ data: [], zone: null });
    }

    const zones = data || [];

    // Try to find exact match
    let matchedZone = null;
    if (city) {
      matchedZone = zones.find(
        (z: any) =>
          z.area_name.toLowerCase() === city ||
          z.division.toLowerCase() === city ||
          z.area_name.toLowerCase().includes(city) ||
          city.includes(z.area_name.toLowerCase()) ||
          city.includes(z.division.toLowerCase())
      );
    }

    // Fallback: if no match, return default Dhaka zone or first active zone
    if (!matchedZone) {
      matchedZone =
        zones.find((z: any) => z.area_name.toLowerCase() === "dhaka") ||
        zones.find((z: any) => z.division.toLowerCase() === "dhaka") ||
        zones[0] || null;
    }

    return NextResponse.json({
      zones,
      zone: matchedZone,
      delivery_charge: matchedZone?.delivery_charge || 0,
      estimated_days: matchedZone?.estimated_days || 3,
    });
  } catch (err: any) {
    return NextResponse.json({ zone: null, delivery_charge: 0, estimated_days: 3 });
  }
}
