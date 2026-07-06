// ===========================================
// Stock Notify API — "Notify Me When Available"
// ===========================================
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey) as any;
}

export async function POST(req: Request) {
  try {
    const supabase = getAdminClient();
    const { product_id, email, user_id, product_name } = await req.json();

    if (!product_id || !email) {
      return NextResponse.json({ error: "product_id and email are required" }, { status: 400 });
    }

    // Check if already subscribed for this product
    const { data: existing } = await supabase
      .from("stock_notify_requests")
      .select("id")
      .eq("product_id", product_id)
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "You're already subscribed for this product!" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("stock_notify_requests")
      .insert({
        product_id,
        email: email.toLowerCase().trim(),
        user_id: user_id || null,
        product_name: product_name || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
