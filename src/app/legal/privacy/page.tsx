import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-[#fbbf24] selection:text-black">
      <Navbar />
      <div className="grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-serif-heading font-bold text-hero-text">Privacy Policy</h1>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none prose-emerald font-sans text-muted-foreground leading-loose">
          <p className="font-semibold text-hero-text">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">2. How We Use Your Information</h2>
          <p>We use the information we collect about you to provide, maintain, and improve our services, including to facilitate payments, send receipts, provide products and services you request, and send related information.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">3. Data Security</h2>
          <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">4. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@mangodb.com" className="text-emerald-600 hover:underline">privacy@mangodb.com</a>.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
