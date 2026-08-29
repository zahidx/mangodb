"use client";

import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrderById } from "@/lib/supabase/queries";
import InvoiceTemplate from "@/components/InvoiceTemplate";
import { downloadInvoicePdf } from "@/lib/downloadInvoicePdf";
import toast from "react-hot-toast";

export default function InvoicePage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      // Try local storage first
      const allOrders = [
        ...JSON.parse(localStorage.getItem("mangobite-orders") || "[]"),
        ...JSON.parse(localStorage.getItem("mangobite-guest-orders") || "[]"),
      ];
      let found = allOrders.find((o: any) => o.id === orderId);

      if (!found) {
        // Fallback to Supabase
        const { data } = await getOrderById(orderId);
        if (data) found = data;
      }

      if (found) {
        setOrder(found);
      }
      setLoading(false);
    }

    fetchOrder();
  }, [orderId]);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    setIsDownloading(true);
    toast.loading("Generating your invoice PDF...", { id: "inv-load" });
    try {
      const ok = await downloadInvoicePdf("invoice-preview-element", orderId);
      if (ok) {
        toast.success("Invoice PDF downloaded!", { id: "inv-load" });
      } else {
        toast.error("Failed to generate PDF.", { id: "inv-load" });
      }
    } catch (err) {
      console.error(err);
      toast.error("PDF generation failed.", { id: "inv-load" });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-hero-text">Invoice Not Found</h1>
        <p className="text-sm text-muted-foreground">
          We could not locate the details for invoice ID: <span className="font-mono">{orderId}</span>
        </p>
        <Link
          href="/products"
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-colors"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const items = order.order_items || [];
  const subtotal =
    order.subtotal ||
    items.reduce((sum: number, item: any) => sum + (item.total_price || item.unit_price * item.quantity || 0), 0);
  const deliveryCharge = order.delivery_charge || 0;
  const discount = order.discount || 0;
  const total = order.total || subtotal + deliveryCharge - discount;

  const invoiceData = {
    orderId: order.id,
    createdAt: order.created_at,
    customerName: order.shipping_address?.full_name || order.customer_name || "Valued Customer",
    customerPhone: order.shipping_address?.phone || order.customer_phone || "N/A",
    customerEmail: order.shipping_address?.email || order._guestEmail || "",
    address:
      order.shipping_address?.address_line_1 ||
      (typeof order.shipping_address === "string" ? order.shipping_address : "Bangladesh"),
    paymentMethod: order.payment_method || "Cash on Delivery",
    paymentStatus: order.payment_status || "pending",
    items: items.map((item: any) => ({
      name: item.product?.name || item.name || "Harvest Mangoes",
      weight: item.selected_weight || "10kg crate",
      quantity: item.quantity || 1,
      unitPrice: item.unit_price || item.total_price || 0,
      totalPrice: item.total_price || (item.unit_price || 0) * (item.quantity || 1),
    })),
    subtotal,
    deliveryCharge,
    discount,
    total,
    deliveryDistrict: order.shipping_address?.city || "Bangladesh",
  };

  return (
    <div className="min-h-screen bg-muted-bg/40 text-foreground">
      {/* Top action toolbar (hidden on print) */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-4 sm:px-8 py-3.5 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/checkout"
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-hero-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Checkout</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-card border border-border hover:bg-muted-bg text-hero-text text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Invoice Document Centered Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 print:py-0 print:px-0 flex justify-center">
        <div className="bg-white shadow-xl rounded-2xl border border-border overflow-hidden print:shadow-none print:border-none">
          <InvoiceTemplate id="invoice-preview-element" data={invoiceData} />
        </div>
      </main>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0.4in;
            size: A4 portrait;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: white !important;
          }
          header {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
