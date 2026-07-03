import { NextResponse } from "next/server";
import { Resend } from "resend";
import { AbandonedCartEmail } from "@/emails/AbandonedCartEmail";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY || "re_test_key");

export async function GET(req: Request) {
  // Use Service Role Key to bypass RLS since this is a background administrative job
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy"
  );

  try {
    // SECURITY: In production, verify this request comes from a trusted CRON runner
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized CRON request" }, { status: 401 });
    }

    // 1. Get all cart items older than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    // Query cart items, joining the user profile to get email and name
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select("user_id, created_at, profiles!inner(email, full_name)")
      .lt("created_at", twoHoursAgo);

    if (cartError) throw cartError;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ message: "No abandoned carts found." });
    }

    // Deduplicate by user_id so we only send one email per person
    const uniqueUsers = new Map();
    for (const item of cartItems) {
      if (!uniqueUsers.has(item.user_id)) {
        uniqueUsers.set(item.user_id, item.profiles);
      }
    }

    const host = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    let emailsSent = 0;

    // 2. Process and Send recovery emails
    for (const [userId, profile] of uniqueUsers.entries()) {
      if (!profile.email) continue;
      
      // Safety Check: Did they already place an order in the last 24 hours?
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (recentOrders && recentOrders.length > 0) {
        continue; // They already checked out, do not spam them.
      }

      // Send the beautifully designed recovery email
      try {
        await resend.emails.send({
          from: "MangoDB Support <hello@mangodb.com>", 
          to: [profile.email],
          subject: "Did you forget your mangoes? 🥭",
          react: AbandonedCartEmail({
            customerName: profile.full_name || "Valued Customer",
            checkoutUrl: `${host}/checkout`,
            discountCode: "COMEBACK5",
          }),
        });
        emailsSent++;
      } catch (emailErr) {
        console.error(`Failed to send recovery to ${profile.email}:`, emailErr);
      }
    }

    return NextResponse.json({ 
      status: "success", 
      message: `Processed ${uniqueUsers.size} carts. Sent ${emailsSent} recovery emails.` 
    });

  } catch (error: any) {
    console.error("Failed to run abandoned cart recovery job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
