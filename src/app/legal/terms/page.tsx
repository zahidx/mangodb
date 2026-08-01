import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-[#fbbf24] selection:text-black">
      <Navbar />
      <div className="grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-amber-500" />
          </div>
          <h1 className="text-4xl font-serif-heading font-bold text-hero-text">Terms of Service</h1>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none prose-amber font-sans text-muted-foreground leading-loose">
          <p className="font-semibold text-hero-text">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">1. Acceptance of Terms</h2>
          <p>By accessing and using MangoBite, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">2. Product Quality & Delivery</h2>
          <p>We strive to deliver the highest quality Rajshahi mangoes. Due to the perishable nature of our agricultural products, all claims regarding quality must be submitted within 24 hours of delivery. We are not responsible for delays caused by extreme weather conditions or third-party logistics failures.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">3. Pricing and Availability</h2>
          <p>All prices are subject to change without notice. We reserve the right to modify or discontinue any product. In the event of a crop failure, seasonal shortage, or supply issue, we will provide a full refund or suitable replacement of equal value.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-hero-text border-b border-border pb-2">4. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer or mobile device. You agree to accept responsibility for all activities that occur under your account or password.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
