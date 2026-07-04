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
      .from("site_settings")
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Convert array of {key, value} to a flat object
    const settingsObject: Record<string, any> = {};
    if (data) {
      data.forEach((item: any) => {
        settingsObject[item.key] = item.value;
      });
    }

    return NextResponse.json({ data: settingsObject });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = getAdminClient();
    const body = await req.json();
    
    // Body should be an object of key-value pairs
    const updates = Object.keys(body).map(key => ({
      key,
      value: body[key],
      updated_at: new Date().toISOString()
    }));

    // Upsert all settings
    const { error } = await supabase
      .from("site_settings")
      .upsert(updates, { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
