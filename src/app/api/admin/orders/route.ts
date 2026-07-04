import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Create a Supabase admin client that uses the service role key to bypass RLS policies
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey) as any;
}

export async function GET() {
  try {
    const supabase = getAdminClient();
    
    // Fetch all orders with items, product info, and profiles
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(*)), profile:profiles(*)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = getAdminClient();
    const body = await req.json();
    const { id, status, payment_status } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Also insert a notification for status change
    try {
      if (data && data.user_id && status) {
        let title = "Order Status Updated";
        let message = `Your order #${id} status is now: ${status.toUpperCase()}.`;
        if (status === "processing") {
          title = "Order Processing Started";
          message = `We have started preparing your mango crate for order #${id}.`;
        } else if (status === "shipped") {
          title = "Order Shipped";
          message = `Great news! Your mango crate for order #${id} has been shipped.`;
        } else if (status === "delivered") {
          title = "Order Delivered";
          message = `Your order #${id} has been successfully delivered. Enjoy the mangoes!`;
        } else if (status === "cancelled") {
          title = "Order Cancelled";
          message = `Your order #${id} has been cancelled.`;
        }

        await supabase.from("notifications").insert({
          user_id: data.user_id,
          title,
          message,
          type: `order_${status}`
        });
      }
    } catch (notifErr) {
      console.warn("Failed to create order status notification:", notifErr);
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    // First delete order items associated with this order
    const { error: itemsErr } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", id);

    if (itemsErr) {
      return NextResponse.json({ error: itemsErr.message }, { status: 400 });
    }

    // Delete the order itself
    const { error: orderErr } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    if (orderErr) {
      return NextResponse.json({ error: orderErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
