// ===========================================
// Save abandoned cart record (guest checkout data)
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
    const { email, name, phone, item_count, cart_total } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Check if there's already a recent unrecovered record for this email
    const { data: existing } = await supabase
      .from("abandoned_carts")
      .select("id, created_at")
      .eq("email", email.toLowerCase().trim())
      .eq("recovered", false)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (existing) {
      // Update existing record with latest cart data
      await supabase
        .from("abandoned_carts")
        .update({
          item_count: item_count || 0,
          cart_total: cart_total || 0,
          name: name || null,
          phone: phone || null,
        })
        .eq("id", existing.id);

      return NextResponse.json({ data: existing, updated: true });
    }

    const { data, error } = await supabase
      .from("abandoned_carts")
      .insert({
        email: email.toLowerCase().trim(),
        name: name || null,
        phone: phone || null,
        item_count: item_count || 0,
        cart_total: cart_total || 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
