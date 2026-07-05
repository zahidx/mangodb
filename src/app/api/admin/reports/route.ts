import { createClient } from "@supabase/supabase-js";
import { endOfDay, format, isWithinInterval, startOfDay, startOfWeek, subDays } from "date-fns";
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
    const timeframe = searchParams.get("timeframe") || "30d";

    // Determine date range
    const endDate = new Date();
    let days = 30;
    if (timeframe === "90d") days = 90;
    else if (timeframe === "12m") days = 365;
    const startDate = subDays(endDate, days);

    // Fetch Orders with items for product-level data
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("id, total, created_at, status, payment_status");

    if (ordersErr) throw ordersErr;

    // Fetch Order Items with product info
    const { data: orderItems, error: itemsErr } = await supabase
      .from("order_items")
      .select("*, product:products(name)");

    if (itemsErr) throw itemsErr;

    // Fetch Products for inventory value
    const { data: products, error: productsErr } = await supabase
      .from("products")
      .select("id, stock, price");

    if (productsErr) throw productsErr;

    // Fetch Customers count
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

    // --- CHART DATA (Daily) --- //
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
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
        orders: dayOrders.length,
      });
    }

    // --- TOP SELLING PRODUCTS --- //
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    const validOrderIds = new Set(validOrders.map((o: any) => o.id));

    for (const item of orderItems || []) {
      if (!validOrderIds.has(item.order_id)) continue;
      const pid = item.product_id;
      if (!productSales[pid]) {
        productSales[pid] = {
          name: item.product?.name || `Product (${pid.slice(0, 6)})`,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[pid].quantity += item.quantity;
      productSales[pid].revenue += item.total_price;
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((p, i) => ({ rank: i + 1, ...p }));

    // --- ORDER STATUS DISTRIBUTION --- //
    const statusCounts: Record<string, number> = {};
    for (const order of orders || []) {
      const s = order.status || "unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    }

    const statusColors: Record<string, string> = {
      pending: "#F59E0B",
      confirmed: "#6366F1",
      processing: "#3B82F6",
      shipped: "#06B6D4",
      delivered: "#10B981",
      cancelled: "#EF4444",
    };

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: statusColors[status] || "#94A3B8",
    }));

    // --- WEEKLY REVENUE --- //
    const weeklyData: Record<string, { week: string; revenue: number; orders: number }> = {};
    for (const order of validOrders) {
      const d = new Date(order.created_at);
      const weekStart = startOfWeek(d, { weekStartsOn: 1 });
      const weekKey = format(weekStart, "MMM dd");
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { week: weekKey, revenue: 0, orders: 0 };
      }
      weeklyData[weekKey].revenue += order.total;
      weeklyData[weekKey].orders += 1;
    }
    const weeklyRevenue = Object.values(weeklyData).sort(
      (a, b) => new Date(a.week).getTime() - new Date(b.week).getTime()
    );

    return NextResponse.json({
      data: {
        totalRevenue,
        totalSales,
        inventoryValue,
        customersCount: customersCount || 0,
        chartData,
        topProducts,
        statusDistribution,
        weeklyRevenue,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
