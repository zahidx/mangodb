// ===========================================
// Public Coupons API — List & Validate at Checkout
// ===========================================
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey) as any;
}

export async function GET() {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("coupons")
      .select("code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, used_count, expires_at, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ data: [] });
    }

    // Filter out expired and fully-used coupons
    const now = new Date();
    const available = (data || []).filter((c: any) => {
      if (c.expires_at && new Date(c.expires_at) < now) return false;
      if (c.usage_limit && c.used_count >= c.usage_limit) return false;
      return true;
    });

    return NextResponse.json({ data: available });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getAdminClient();
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: "Coupon code is required" });
    }

    const formattedCode = code.toUpperCase().trim();

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", formattedCode)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" });
    }

    // Check if active
    if (!data.is_active) {
      return NextResponse.json({ valid: false, error: "This coupon is no longer active" });
    }

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "This coupon has expired" });
    }

    // Check usage limit
    if (data.usage_limit && data.used_count >= data.usage_limit) {
      return NextResponse.json({ valid: false, error: "This coupon has reached its usage limit" });
    }

    // Check minimum order
    if (subtotal && subtotal < data.min_order_amount) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order amount of ৳${data.min_order_amount} required`,
      });
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        max_discount_amount: data.max_discount_amount,
        min_order_amount: data.min_order_amount,
      },
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Failed to validate coupon" });
  }
}
