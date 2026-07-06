// ===========================================
// Wishlist API — Sync wishlist with Supabase
// ===========================================
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey) as any;
}

// GET — Fetch all wishlist product IDs for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("wishlist")
      .select("product_id, created_at")
      .eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — Add a product to wishlist
export async function POST(req: Request) {
  try {
    const supabase = getAdminClient();
    const { user_id, product_id } = await req.json();

    if (!user_id || !product_id) {
      return NextResponse.json({ error: "user_id and product_id are required" }, { status: 400 });
    }

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", user_id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ data: existing, message: "Already in wishlist" });
    }

    const { data, error } = await supabase
      .from("wishlist")
      .insert({ user_id, product_id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — Remove a product from wishlist
export async function DELETE(req: Request) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const product_id = searchParams.get("product_id");

    if (!user_id || !product_id) {
      return NextResponse.json({ error: "user_id and product_id are required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", user_id)
      .eq("product_id", product_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
