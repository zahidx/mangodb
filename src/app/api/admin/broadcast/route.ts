// ===========================================
// Broadcast Notification API (Admin)
// Sends a notification to all or specific users
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
    const { title, message, type, userIds } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    let targetUsers = userIds;

    // If no specific users, send to all
    if (!targetUsers || targetUsers.length === 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id");
      targetUsers = (profiles || []).map((p: any) => p.id);
    }

    // Insert notifications in batches
    const batchSize = 50;
    let inserted = 0;
    for (let i = 0; i < targetUsers.length; i += batchSize) {
      const batch = targetUsers.slice(i, i + batchSize).map((uid: string) => ({
        user_id: uid,
        title,
        message,
        type: type || "system",
        is_read: false,
      }));

      const { error } = await supabase.from("notifications").insert(batch);
      if (error) console.error("Batch insert error:", error);
      else inserted += batch.length;
    }

    return NextResponse.json({
      success: true,
      sent_to: inserted,
      total_users: targetUsers.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
