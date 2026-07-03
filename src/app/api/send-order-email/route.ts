import { NextResponse } from "next/server";
import { Resend } from "resend";
import OrderReceipt from "@/emails/OrderReceipt";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

export async function POST(req: Request) {
  try {
    const { orderId, customerName, email, total, productName, shippingAddress } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // In a real scenario without a verified domain, Resend requires sending to the verified email.
    // For demo purposes, we usually send it to a verified test address or use a fallback.
    const { data, error } = await resend.emails.send({
      from: "MangoDB Orders <onboarding@resend.dev>", // Default resend testing domain
      to: [email],
      subject: `Order Confirmation - MangoDB #${orderId}`,
      react: OrderReceipt({
        orderId,
        customerName,
        total,
        productName,
        shippingAddress,
      }) as React.ReactElement,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
