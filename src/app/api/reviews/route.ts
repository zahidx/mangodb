// ===========================================
// Public Reviews API — Submit reviews from the frontend
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
    const body = await req.json();
    const { user_id, product_id, rating, comment, images } = body;

    if (!user_id || !product_id || !rating) {
      return NextResponse.json(
        { error: "user_id, product_id, and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate images array if provided
    const validatedImages = Array.isArray(images) ? images.filter((url: string) => typeof url === "string" && url.length > 0) : null;

    // Check if user already reviewed this product (upsert behavior)
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user_id)
      .eq("product_id", product_id)
      .maybeSingle();

    let result;
    if (existing) {
      // Update existing review
      result = await supabase
        .from("reviews")
        .update({ rating, comment: comment || null, images: validatedImages, is_approved: false })
        .eq("id", existing.id)
        .select("*, profile:profiles(full_name, avatar_url)")
        .single();
    } else {
      // Insert new review
      result = await supabase
        .from("reviews")
        .insert({
          user_id,
          product_id,
          rating,
          comment: comment || null,
          images: validatedImages,
          is_approved: false,
        })
        .select("*, profile:profiles(full_name, avatar_url)")
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
