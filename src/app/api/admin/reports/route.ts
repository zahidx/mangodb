import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { subDays, format, startOfDay, endOfDay, isWithinInterval } from "date-fns";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey) as any;
}

export async function GET(req: Request) {
  try {
    const supabase = getAdminClient();
    
    // Default timeframe is 30 days
    const endDate = new Date();
    const startDate = subDays(endDate, 30);

    // Fetch Orders
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("id, total, created_at, status, payment_status");

    if (ordersErr) throw ordersErr;

    // Fetch Products
    const { data: products, error: productsErr } = await supabase
      .from("products")
      .select("id, stock, price");

    if (productsErr) throw productsErr;

    // Fetch Customers
    const { count: customersCount, error: custErr } = await supabase
      .from("profiles")
      .select("*", { count: 'exact', head: true });

    if (custErr) throw custErr;

    // --- AGGREGATIONS --- //
    const validOrders = (orders || []).filter((o: any) => o.payment_status === "paid" && o.status !== "cancelled");
    
    // Revenue & Sales Total
    const totalRevenue = validOrders.reduce((acc: number, o: any) => acc + o.total, 0);
    const totalSales = validOrders.length;
    
    // Inventory Value
    const inventoryValue = (products || []).reduce((acc: number, p: any) => acc + (p.stock * p.price), 0);

    // Chart Data: Last 30 Days Revenue
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const targetDate = subDays(endDate, i);
      const dayStart = startOfDay(targetDate);
      const dayEnd = endOfDay(targetDate);
      
      const dayOrders = validOrders.filter((o: any) => {
        const orderDate = new Date(o.created_at);
        return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
      });

      chartData.push({
        date: format(targetDate, "MMM dd"),
        revenue: dayOrders.reduce((acc: number, o: any) => acc + o.total, 0),
        orders: dayOrders.length
      });
    }

    return NextResponse.json({
      data: {
        totalRevenue,
        totalSales,
        inventoryValue,
        customersCount: customersCount || 0,
        chartData
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
