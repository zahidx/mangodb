import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Truck } from "lucide-react";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-[#fbbf24] selection:text-black">
      <Navbar />
      <div className="grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Truck className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-4xl font-serif-heading font-bold text-hero-text">Shipping & Delivery Policy</h1>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none font-sans text-muted-foreground leading-loose">
          <p className="font-semibold text-hero-text">Last updated: {new Date().toLocaleDateString()}</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">1. Delivery Areas</h2>
          <p>We currently deliver across Bangladesh. Our primary coverage includes all 64 districts, with express same-day delivery available within Dhaka Metropolitan Area.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">2. Delivery Charges</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 text-hero-text font-bold">Zone</th>
                <th className="text-left py-3 text-hero-text font-bold">Standard Delivery</th>
                <th className="text-left py-3 text-hero-text font-bold">Estimated Time</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-3">Inside Dhaka</td>
                <td className="py-3 font-bold text-hero-text">৳120</td>
                <td className="py-3">Same day — 24 hours</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3">Outside Dhaka</td>
                <td className="py-3 font-bold text-hero-text">৳200</td>
                <td className="py-3">2 — 4 business days</td>
              </tr>
            </tbody>
          </table>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">3. Packaging</h2>
          <p>All mangoes are packed in food-grade, ventilated corrugated crates with cushioning foam inserts to prevent bruising during transit. Each crate is sealed with tamper-evident tape.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">4. Delivery Delays</h2>
          <p>While we strive for on-time delivery, delays may occur due to extreme weather (cyclones, heavy monsoon), political events (hartals/strikes), or courier capacity constraints during peak mango season (May–July). We are not liable for delays beyond our control but will keep you informed.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">5. Order Tracking</h2>
          <p>Every order is assigned a tracking ID. Visit our <a href="/track" className="text-emerald-600 hover:underline font-bold">Order Tracking</a> page and enter your Order ID to see real-time delivery progress.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
