import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RotateCcw } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-[#fbbf24] selection:text-black">
      <Navbar />
      <div className="grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <RotateCcw className="w-6 h-6 text-rose-500" />
          </div>
          <h1 className="text-4xl font-serif-heading font-bold text-hero-text">Refund & Return Policy</h1>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none font-sans text-muted-foreground leading-loose">
          <p className="font-semibold text-hero-text">Last updated: {new Date().toLocaleDateString()}</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">1. Perishable Goods Notice</h2>
          <p>Mangoes are perishable agricultural products. Due to their nature, all quality-related claims must be submitted <strong>within 24 hours</strong> of delivery with photographic evidence. Claims submitted after this window cannot be processed.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">2. Eligible Refund Scenarios</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Mangoes arrive visibly damaged, crushed, or leaking</li>
            <li>Order is significantly different from what was purchased (wrong variety)</li>
            <li>Delivery failed to arrive within the stated timeframe and product spoiled</li>
            <li>Crop failure or supply shortage preventing fulfillment (automatic full refund)</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">3. Non-Refundable Scenarios</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Change of mind after delivery has been initiated</li>
            <li>Natural variations in size, color, or sweetness level (these are organic products)</li>
            <li>Damage caused by improper storage after delivery</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">4. How to Request a Refund</h2>
          <p>Contact us within 24 hours of delivery via WhatsApp at <strong>+88 01742-805845</strong> or email <a href="mailto:support@mangodb.com" className="text-emerald-600 hover:underline font-bold">support@mangodb.com</a> with your Order ID and clear photos of the issue. We typically process refunds within 3-5 business days.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">5. Refund Method</h2>
          <p>Refunds will be issued to the original payment method. For COD orders, refunds will be processed via bKash or bank transfer to an account you provide.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
