// ===========================================
// Reports CSV Export API
// ===========================================
import { createClient } from "@supabase/supabase-js";
import { format, subDays } from "date-fns";
import { NextResponse } from "next/server";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key) as any;
}

export async function GET(req: Request) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "30d";
    const days = timeframe === "90d" ? 90 : timeframe === "12m" ? 365 : 30;
    const startDate = subDays(new Date(), days);

    const { data: orders } = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(name)), profile:profiles(full_name, email)")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (!orders) {
      return new NextResponse("No data", { status: 404 });
    }

    // Build CSV
    const headers = ["Order ID", "Date", "Customer", "Email", "Items", "Total", "Status", "Payment", "Shipping Address"];
    const rows = orders.map((o: any) => [
      o.id.slice(0, 8),
      format(new Date(o.created_at), "yyyy-MM-dd"),
      o.profile?.full_name || o.shipping_address?.full_name || "Guest",
      o.profile?.email || "",
      (o.order_items || []).map((i: any) => `${i.product?.name || "Item"} x${i.quantity}`).join("; "),
      o.total,
      o.status,
      o.payment_status,
      o.shipping_address?.address_line_1 || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r: any) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mangodb-orders-${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    });
  } catch (err: any) {
    return new NextResponse(`Error: ${err.message}`, { status: 500 });
  }
}
