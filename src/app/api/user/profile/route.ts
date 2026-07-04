import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the payload
    const payload = await request.json();
    
    // Remove fields that might not exist in the database schema yet
    // to prevent PGRST204 errors (Schema cache mismatch)
    const { 
      city, 
      country, 
      dob, 
      gender,
      ...validUpdateData 
    } = payload;

    // Update the profile in the database with only the valid columns
    const { data: updatedProfile, error: updateError } = await (supabase as any)
      .from("profiles")
      .update({
        ...validUpdateData,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ 
        error: "Failed to update profile", 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile 
    });

  } catch (err: any) {
    console.error("Profile API error:", err);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: err.message 
    }, { status: 500 });
  }
}
