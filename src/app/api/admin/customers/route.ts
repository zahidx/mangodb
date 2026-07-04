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
    
    // Fetch all profiles from Supabase database
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sanitize to ensure is_blocked defaults to false if missing from table schema
    const sanitizedData = (data || []).map((p: any) => ({
      ...p,
      is_blocked: p.is_blocked ?? false
    }));

    return NextResponse.json({ data: sanitizedData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getAdminClient();
    const body = await req.json();

    if (body.action === "seed") {
      const seedProfiles = [
        {
          id: "e03b6a9c-0975-4bb0-8be0-b5391219b101",
          full_name: "Kamrul Hasan",
          email: "kamrul@gmail.com",
          phone: "01728394819",
          role: "user",
          is_blocked: false,
          created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "d9e8c7b6-1234-4567-89ab-cdef01234567",
          full_name: "Nusrat Jahan",
          email: "nusrat@gmail.com",
          phone: "01928394829",
          role: "user",
          is_blocked: false,
          created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "c8b7a6f5-5678-4cd3-a2b1-0987654321fe",
          full_name: "Zahid Islam",
          email: "zahid@example.com",
          phone: "01712345678",
          role: "user",
          is_blocked: false,
          created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "b7a6f5e4-9012-4ba3-8d7c-ef9876543210",
          full_name: "Sultana Razia",
          email: "razia@yahoo.com",
          phone: "01827364510",
          role: "user",
          is_blocked: true,
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "a6f5e4d3-3456-4c92-b87a-fe0123456789",
          full_name: "Tanvir Rahman",
          email: "tanvir@hotmail.com",
          phone: "01529384756",
          role: "user",
          is_blocked: false,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      let result = await supabase
        .from("profiles")
        .insert(seedProfiles)
        .select();

      // Fallback: If is_blocked doesn't exist, retry without it
      if (result.error && result.error.message.includes("is_blocked")) {
        const seedWithoutBlocked = seedProfiles.map(({ is_blocked, ...rest }) => rest);
        result = await supabase
          .from("profiles")
          .insert(seedWithoutBlocked)
          .select();
      }

      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 400 });
      }
      return NextResponse.json({ data: result.data });
    }

    const { id, full_name, email, phone, role, is_blocked } = body;

    if (!full_name || !email) {
      return NextResponse.json({ error: "Missing required fields: full_name, email" }, { status: 400 });
    }

    // Ensure the ID is a valid 36-character UUID string or generate a new random UUID
    const customerId = (id && id.length === 36) ? id : crypto.randomUUID();
    const newProfile = {
      id: customerId,
      full_name,
      email: email.toLowerCase().trim(),
      phone: phone || "",
      role: role || "user",
      is_blocked: !!is_blocked,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let result = await supabase
      .from("profiles")
      .insert(newProfile)
      .select()
      .single();

    // Fallback: If is_blocked doesn't exist in Supabase schema, retry without it
    if (result.error && result.error.message.includes("is_blocked")) {
      const { is_blocked: _, ...profileWithoutBlocked } = newProfile;
      result = await supabase
        .from("profiles")
        .insert(profileWithoutBlocked)
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = getAdminClient();
    const body = await req.json();
    const { id, full_name, email, phone, role, is_blocked } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
    }

    const updateData: any = {
      full_name,
      email: email?.toLowerCase().trim(),
      phone: phone || "",
      role,
      is_blocked,
      updated_at: new Date().toISOString()
    };

    let result = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    // Fallback: If is_blocked doesn't exist, retry without it
    if (result.error && result.error.message.includes("is_blocked")) {
      const { is_blocked: _, ...updateWithoutBlocked } = updateData;
      result = await supabase
        .from("profiles")
        .update(updateWithoutBlocked)
        .eq("id", id)
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
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
      return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
