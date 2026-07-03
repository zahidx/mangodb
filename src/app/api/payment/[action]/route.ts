import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params; // success, fail, cancel, ipn
  const formData = await req.formData();
  const tran_id = formData.get("tran_id") as string;
  
  const host = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // In a real production app, we would:
  // 1. Verify the payment signature using SSLCommerz Validation API
  // 2. Update the Supabase `orders` table to set `payment_status` = 'paid'
  // For now, we route based on the gateway callback:

  if (action === "success") {
    // Redirect to tracking page with the transaction ID
    return NextResponse.redirect(`${host}/track?id=${tran_id}`, 303);
  }

  if (action === "fail" || action === "cancel") {
    // Redirect back to checkout to try again
    return NextResponse.redirect(`${host}/checkout?error=payment_${action}`, 303);
  }

  if (action === "ipn") {
    // Background Server-to-Server notification (Instant Payment Notification)
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
