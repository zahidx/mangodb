import AdminOrderNotification from "@/emails/AdminOrderNotification";
import OrderReceipt from "@/emails/OrderReceipt";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@mangobite.com";

export async function POST(req: Request) {
  try {
    const {
      orderId,
      customerName,
      email,
      phone,
      total,
      productName,
      shippingAddress,
      paymentMethod,
    } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const results: { type: string; status: string; error?: string }[] = [];

    // 1. Send order confirmation to customer
    const customerResult = await resend.emails.send({
      from: "MangoBite Orders <onboarding@resend.dev>",
      to: [email],
      subject: `Order Confirmed 🥭 - MangoBite #${orderId}`,
      react: OrderReceipt({
        orderId,
        customerName,
        total,
        productName,
        shippingAddress,
      }) as React.ReactElement,
    });

    if (customerResult.error) {
      results.push({ type: "customer", status: "failed", error: customerResult.error.message });
    } else {
      results.push({ type: "customer", status: "sent" });
    }

    // 2. Send admin notification
    const adminResult = await resend.emails.send({
      from: "MangoBite Orders <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `🛵 New Order: ${orderId} — ${customerName}`,
      react: AdminOrderNotification({
        orderId,
        customerName,
        customerEmail: email,
        customerPhone: phone || "N/A",
        total,
        productName,
        shippingAddress,
        paymentMethod: paymentMethod || "Cash on Delivery",
      }) as React.ReactElement,
    });

    if (adminResult.error) {
      results.push({ type: "admin", status: "failed", error: adminResult.error.message });
    } else {
      results.push({ type: "admin", status: "sent" });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send emails" },
      { status: 500 }
    );
  }
}
