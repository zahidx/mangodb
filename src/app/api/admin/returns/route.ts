// ===========================================
// Admin Return Requests API
// ===========================================
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey) as any;
}

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("return_requests")
      .select("*, order:orders(*), profile:profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ data: [] });
    return NextResponse.json({ data: data || [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = getAdminClient();
    const { id, status, admin_note } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const updateData: any = { status };
    if (admin_note !== undefined) updateData.admin_note = admin_note;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("return_requests")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
