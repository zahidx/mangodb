// ===========================================
// Return Requests API (User-facing)
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
    const { order_id, user_id, reason } = await req.json();

    if (!order_id || !user_id || !reason?.trim()) {
      return NextResponse.json({ error: "order_id, user_id, and reason are required" }, { status: 400 });
    }

    // Check if return already exists for this order
    const { data: existing } = await supabase
      .from("return_requests")
      .select("id, status")
      .eq("order_id", order_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "A return request already exists for this order", status: existing.status }, { status: 400 });
    }

    // Check if order is delivered
    const { data: order } = await supabase
      .from("orders")
      .select("status")
      .eq("id", order_id)
      .single();

    if (!order || order.status !== "delivered") {
      return NextResponse.json({ error: "Only delivered orders can be returned" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("return_requests")
      .insert({ order_id, user_id, reason })
      .select("*, order:orders(*)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
