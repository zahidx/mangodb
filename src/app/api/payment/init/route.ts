import { NextResponse } from "next/server";
import SSLCommerzPayment from "sslcommerz-lts";

const store_id = process.env.SSLCOMMERZ_STORE_ID || "testbox";
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || "testpassword";
const is_live = false; // true for live, false for sandbox

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, total, customerName, email, phone, address } = body;

    const host = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const data = {
      total_amount: total,
      currency: "BDT",
      tran_id: orderId, // use unique tran_id for each api call
      success_url: `${host}/api/payment/success`,
      fail_url: `${host}/api/payment/fail`,
      cancel_url: `${host}/api/payment/cancel`,
      ipn_url: `${host}/api/payment/ipn`,
      shipping_method: "Courier",
      product_name: "Premium Rajshahi Mangoes",
      product_category: "Food",
      product_profile: "general",
      cus_name: customerName,
      cus_email: email || "customer@example.com",
      cus_add1: address,
      cus_add2: "Dhaka",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: phone,
      cus_fax: phone,
      ship_name: customerName,
      ship_add1: address,
      ship_add2: "Dhaka",
      ship_city: "Dhaka",
      ship_state: "Dhaka",
      ship_postcode: 1000,
      ship_country: "Bangladesh",
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    
    const apiResponse = await sslcz.init(data);
    
    if (apiResponse?.GatewayPageURL) {
      return NextResponse.json({ 
        url: apiResponse.GatewayPageURL,
        status: "success" 
      });
    }

    return NextResponse.json({ error: "Gateway URL not found" }, { status: 400 });

  } catch (error: any) {
    console.error("SSLCommerz Init Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
