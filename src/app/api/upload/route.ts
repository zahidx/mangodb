// ===========================================
// MangoDB Market — Image Upload API
// ===========================================
// Handles file uploads to Supabase Storage buckets
// Supported buckets: product-images, category-images

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "product-images";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, GIF, and AVIF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Validate bucket name
    const allowedBuckets = ["product-images", "category-images", "avatars", "banner-images"];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ error: "Invalid bucket name" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Generate a unique file name
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split(".").pop() || "png";
    const fileName = `${timestamp}_${randomStr}.${ext}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    let { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    // If bucket doesn't exist, try to create it and re-upload
    if (error && (error.message?.includes("Bucket not found") || error.statusCode === "404")) {
      try {
        await supabase.storage.createBucket(bucket, { public: true });
        // Retry upload
        const retry = await supabase.storage
          .from(bucket)
          .upload(fileName, buffer, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          });
        data = retry.data || data;
        error = retry.error;
      } catch (createErr: any) {
        return NextResponse.json({
          error: `Storage bucket "${bucket}" not found and could not be created. Run the SQL migration or create it manually in your Supabase dashboard.`,
        }, { status: 500 });
      }
    }

    if (error) {
      console.error("Upload error:", error);
      // Catch RLS violations
      if (error.message?.includes("row-level security") || error.statusCode === "42501" || error.statusCode === "401") {
        return NextResponse.json({
          error: "Storage permission denied. Set SUPABASE_SERVICE_ROLE_KEY in your .env.local, or run the storage RLS migration in your Supabase SQL editor.",
        }, { status: 500 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data?.path) {
      return NextResponse.json({ error: "Upload succeeded but no path returned" }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: data.path,
      bucket,
    });
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
