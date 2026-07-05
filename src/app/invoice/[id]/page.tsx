"use client";

import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    
    // Try to find the order
    const allOrders = [
      ...JSON.parse(localStorage.getItem("mangodb-orders") || "[]"),
      ...JSON.parse(localStorage.getItem("mangodb-guest-orders") || "[]"),
    ];
    const found = allOrders.find((o: any) => o.id === orderId);
    
    if (found) {
      setOrder(found);
    }
    setLoading(false);
  }, [orderId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading invoice...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
        <p className="text-gray-500">This invoice could not be found.</p>
        <Link href="/orders" className="text-emerald-600 hover:underline text-sm font-semibold">View Your Orders</Link>
      </div>
    );
  }

  const items = order.order_items || [];
  const subtotal = order.subtotal || items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
  const deliveryCharge = order.delivery_charge || 0;
  const discount = order.discount || 0;
  const total = order.total || subtotal + deliveryCharge - discount;

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <span className="text-sm font-semibold text-gray-900">Invoice #{orderId}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 print:py-0 print:px-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 print:shadow-none print:border-none overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-10 print:bg-white print:border-b-2 print:border-emerald-600">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white print:text-gray-900">INVOICE</h1>
                <p className="text-emerald-100 print:text-gray-500 text-sm mt-1">Order Receipt — MangoDB</p>
              </div>
              <div className="text-right text-white print:text-gray-900">
                <p className="text-xl font-bold">MangoDB</p>
                <p className="text-xs text-emerald-100 print:text-gray-500">Premium Rajshahi Mangoes</p>
                <p className="text-xs text-emerald-100 print:text-gray-500 mt-1">Dhaka, Bangladesh</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Order Info */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Order ID</p>
                <p className="text-sm font-mono font-semibold text-gray-900">{order.id}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
                <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${
                  order.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                  order.status === "processing" ? "bg-blue-100 text-blue-700" :
                  order.status === "cancelled" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {order.status}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Customer & Shipping */}
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
                <p className="text-sm font-semibold text-gray-900">{order.shipping_address?.full_name || "N/A"}</p>
                <p className="text-xs text-gray-500 mt-0.5">{order.shipping_address?.phone || ""}</p>
                {order._guestEmail && <p className="text-xs text-gray-500">{order._guestEmail}</p>}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Ship To</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {order.shipping_address?.address_line_1 || order.shipping_address || "N/A"}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Order Items</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Product</th>
                    <th className="text-center pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Qty</th>
                    <th className="text-right pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Price</th>
                    <th className="text-right pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && order.shipping_address && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 text-xs">Item details not available</td>
                    </tr>
                  )}
                  {items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3">
                        <p className="font-semibold text-gray-900">{item.product?.name || "Product"}</p>
                        {item.selected_weight && (
                          <p className="text-[11px] text-gray-500">{item.selected_weight}</p>
                        )}
                      </td>
                      <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-700">৳{item.unit_price?.toLocaleString() || "—"}</td>
                      <td className="py-3 text-right font-semibold text-gray-900">৳{item.total_price?.toLocaleString() || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4">
              <div className="ml-auto sm:w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span className="text-gray-900">৳{deliveryCharge.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-emerald-600">-৳{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-emerald-600">৳{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Payment</span>
                  <span className="capitalize">{order.payment_status || "pending"}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 text-center">
              <p className="text-xs text-gray-400">
                Thank you for choosing MangoDB! Your fresh, premium mangoes are handpicked with care.
              </p>
              <p className="text-[10px] text-gray-300 mt-1">
                For any inquiries, contact support@mangodb.com | +880 1700-000000
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
