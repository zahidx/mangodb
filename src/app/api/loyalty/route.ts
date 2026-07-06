// ===========================================
// Loyalty Points API — Fetch & manage points
// ===========================================
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey) as any;
}

// GET — Fetch loyalty points + recent transactions for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Get or create points record
    let { data: points } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!points) {
      const { data: newPoints } = await supabase
        .from("loyalty_points")
        .insert({ user_id: userId, points: 0, lifetime_earned: 0, tier: "bronze" })
        .select()
        .single();
      points = newPoints;
    }

    // Get recent transactions
    const { data: transactions } = await supabase
      .from("loyalty_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      points: points || { points: 0, lifetime_earned: 0, tier: "bronze" },
      transactions: transactions || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — Earn or spend points (used by system on order completion)
export async function POST(req: Request) {
  try {
    const supabase = getAdminClient();
    const { user_id, points, transaction_type, description, reference_id } = await req.json();

    if (!user_id || !points || !transaction_type) {
      return NextResponse.json({ error: "user_id, points, and transaction_type are required" }, { status: 400 });
    }

    // Get current points
    const { data: current } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (!current) {
      return NextResponse.json({ error: "User has no loyalty record" }, { status: 400 });
    }

    const newPoints = current.points + points;
    if (newPoints < 0) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
    }

    const isEarn = points > 0;
    const newLifetimeEarned = isEarn ? current.lifetime_earned + points : current.lifetime_earned;

    // Calculate tier
    let tier = current.tier;
    if (newLifetimeEarned >= 5000) tier = "platinum";
    else if (newLifetimeEarned >= 2000) tier = "gold";
    else if (newLifetimeEarned >= 500) tier = "silver";
    else tier = "bronze";

    // Update points
    const { data: updated, error: updateError } = await supabase
      .from("loyalty_points")
      .update({ points: newPoints, lifetime_earned: newLifetimeEarned, tier })
      .eq("user_id", user_id)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    // Create transaction record
    const { error: txError } = await supabase
      .from("loyalty_transactions")
      .insert({
        user_id,
        points,
        transaction_type,
        description: description || null,
        reference_id: reference_id || null,
        balance_after: newPoints,
      });

    if (txError) console.error("Failed to log transaction:", txError);

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
