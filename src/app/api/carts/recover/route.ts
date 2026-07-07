// ===========================================
// Abandoned Cart Recovery API
// ===========================================
// Finds carts that haven't been touched in >24 hours
// and sends recovery emails with a discount code.
// Can be called manually from admin panel or via cron job.
// ===========================================

import { AbandonedCartEmail } from "@/emails/AbandonedCartEmail";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey) as any;
}

// GET — Check for abandoned carts (dry-run, returns count)
export async function GET(req: Request) {
  try {
    const supabase = getAdminClient();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS).toISOString();

    // Check Supabase for abandoned carts (logged-in users)
    const { data: dbCarts, error: dbError } = await supabase
      .from("cart_items")
      .select("user_id, created_at")
      .lt("created_at", cutoff);

    if (dbError) throw dbError;

    // Also check abandoned_carts table for guest records
    let abandonedRecords: any[] = [];
    const { data: abRecs, error: abError } = await supabase
      .from("abandoned_carts")
      .select("*")
      .eq("recovered", false)
      .lt("created_at", cutoff);

    if (abError) {
      if (!abError.message?.includes("schema cache") && !abError.message?.includes("does not exist")) {
        throw abError;
      }
    } else {
      abandonedRecords = abRecs || [];
    }

    const uniqueUsers = new Set((dbCarts || []).map((c: any) => c.user_id));

    return NextResponse.json({
      abandoned_users_count: uniqueUsers.size,
      abandoned_guest_records: (abandonedRecords || []).length,
      total_abandoned: uniqueUsers.size + (abandonedRecords || []).length,
      cutoff_time: cutoff,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — Execute recovery: find abandoned carts and send emails
export async function POST(req: Request) {
  try {
    const supabase = getAdminClient();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS).toISOString();

    const results: { type: string; email: string; status: string }[] = [];
    const discountCode = "COMEBACK5";

    // 1. Recover abandoned guest records from the abandoned_carts table
    let guestRecords: any[] = [];
    const { data: gRecs, error: guestError } = await supabase
      .from("abandoned_carts")
      .select("*")
      .eq("recovered", false)
      .lt("created_at", cutoff);

    if (guestError) {
      if (!guestError.message?.includes("schema cache") && !guestError.message?.includes("does not exist")) {
        throw guestError;
      }
    } else {
      guestRecords = gRecs || [];
    }

    for (const record of guestRecords || []) {
      if (!record.email) continue;

      try {
        const emailResult = await resend.emails.send({
          from: "MangoDB <onboarding@resend.dev>",
          to: [record.email],
          subject: "🛒 You left something behind! Complete your MangoDB order",
          react: AbandonedCartEmail({
            customerName: record.name || "Valued Customer",
            checkoutUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3008"}/checkout`,
            discountCode,
          }) as React.ReactElement,
        });

        if (emailResult.error) {
          results.push({ type: "guest", email: record.email, status: `failed: ${emailResult.error.message}` });
        } else {
          // Mark as recovered
          await supabase.from("abandoned_carts").update({ recovered: true, recovered_at: new Date().toISOString() }).eq("id", record.id);
          results.push({ type: "guest", email: record.email, status: "sent" });
        }
      } catch (err: any) {
        results.push({ type: "guest", email: record.email, status: `error: ${err.message}` });
      }
    }

    // 2. Recover logged-in users with abandoned carts
    const { data: dbCarts, error: dbError } = await supabase
      .from("cart_items")
      .select("user_id, created_at")
      .lt("created_at", cutoff);

    if (dbError) throw dbError;

    const processedUsers = new Set<string>();
    for (const cartItem of dbCarts || []) {
      if (processedUsers.has(cartItem.user_id)) continue;
      processedUsers.add(cartItem.user_id);

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", cartItem.user_id)
        .single();

      if (!profile?.email) continue;

      try {
        const emailResult = await resend.emails.send({
          from: "MangoDB <onboarding@resend.dev>",
          to: [profile.email],
          subject: "🛒 Complete your MangoDB order — items waiting in your cart!",
          react: AbandonedCartEmail({
            customerName: profile.full_name || "Valued Customer",
            checkoutUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3008"}/checkout`,
            discountCode,
          }) as React.ReactElement,
        });

        results.push({
          type: "registered",
          email: profile.email,
          status: emailResult.error ? `failed: ${emailResult.error.message}` : "sent",
        });
      } catch (err: any) {
        results.push({ type: "registered", email: profile.email, status: `error: ${err.message}` });
      }
    }

    return NextResponse.json({
      success: true,
      total_processed: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status.startsWith("failed") || r.status.startsWith("error")).length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
