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
      .from("products")
      .select("*, category:categories(id, name)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getAdminClient();
    const body = await req.json();
    
    // Add default values for required fields if they are missing
    const newProduct = {
      ...body,
      stock: body.stock || 0,
      price: body.price || 0,
      images: body.images || [],
      metadata: body.metadata || {},
    };

    const { data, error } = await supabase
      .from("products")
      .insert(newProduct)
      .select("*, category:categories(id, name)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = getAdminClient();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }

    // Fetch previous stock before updating (for history logging)
    let previousStock = 0;
    if (updateData.stock !== undefined) {
      const { data: existing } = await supabase
        .from("products")
        .select("stock")
        .eq("id", id)
        .single();
      if (existing) previousStock = existing.stock;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select("*, category:categories(id, name)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log stock change to history
    if (updateData.stock !== undefined && previousStock !== updateData.stock) {
      const changeAmount = updateData.stock - previousStock;
      try {
        await supabase.from("stock_history").insert({
          product_id: id,
          previous_stock: previousStock,
          new_stock: updateData.stock,
          change_amount: changeAmount,
          reason: "manual_adjustment",
          changed_by: null, // Could be enhanced with admin user ID
        });
      } catch (logErr) {
        console.warn("Failed to log stock history:", logErr);
      }
    }

    return NextResponse.json({ data });
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
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("products")
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
