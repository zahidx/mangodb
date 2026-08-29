"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, Truck, Package } from "lucide-react";

interface InvoiceData {
  orderId: string;
  createdAt?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  items: Array<{
    name: string;
    weight: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  deliveryDistrict?: string;
}

export default function InvoiceTemplate({ data, id = "invoice-pdf-element" }: { data: InvoiceData; id?: string }) {
  const formattedDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div
      id={id}
      style={{
        width: "794px", // Standard A4 width in pixels at 96 DPI
        minHeight: "1123px",
        backgroundColor: "#ffffff",
        color: "#0f172a",
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "48px",
        boxSizing: "border-box",
      }}
      className="invoice-document"
    >
      {/* Brand Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "24px", marginBottom: "28px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.03em", color: "#047857" }}>
              Mango<span style={{ color: "#d97706" }}>Bite</span>
            </span>
            <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", backgroundColor: "#ecfdf5", color: "#047857", padding: "3px 8px", borderRadius: "6px", border: "1px solid #a7f3d0" }}>
              Official Receipt
            </span>
          </div>
          <p style={{ margin: "0", fontSize: "12px", color: "#64748b" }}>
            Premium Rajshahi Orchard Harvest & Agro Goods
          </p>
          <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#94a3b8" }}>
            Charghat Orchard Zone, Rajshahi • Central Hub: Dhaka, Bangladesh
          </p>
          <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#94a3b8" }}>
            Contact: support@mangobite.com | +880 1700-000000 | www.mangobite.com
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: "0", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.02em", color: "#0f172a" }}>
            INVOICE
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "700", color: "#047857", fontFamily: "monospace" }}>
            #{data.orderId}
          </p>
          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
            Date: <strong style={{ color: "#0f172a" }}>{formattedDate}</strong>
          </p>
        </div>
      </div>

      {/* Invoice Meta & Customer Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", padding: "20px", backgroundColor: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "28px" }}>
        <div>
          <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: "6px" }}>
            Billed & Delivered To:
          </span>
          <p style={{ margin: "0", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
            {data.customerName || "Valued Customer"}
          </p>
          <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#475569" }}>
            Phone: <strong style={{ color: "#0f172a" }}>{data.customerPhone}</strong>
          </p>
          {data.customerEmail && (
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#475569" }}>
              Email: {data.customerEmail}
            </p>
          )}
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
            Address: {data.address}
          </p>
        </div>

        <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "24px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: "6px" }}>
            Order & Dispatch Telemetry:
          </span>
          <p style={{ margin: "0", fontSize: "12px", color: "#475569" }}>
            Payment Method:{" "}
            <strong style={{ color: "#0f172a", textTransform: "capitalize" }}>
              {data.paymentMethod === "cod" ? "Cash on Delivery" : data.paymentMethod}
            </strong>
          </p>
          <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#475569" }}>
            Payment Status:{" "}
            <span style={{ fontWeight: "700", color: data.paymentStatus === "paid" ? "#047857" : "#d97706", textTransform: "uppercase" }}>
              {data.paymentStatus}
            </span>
          </p>
          <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#475569" }}>
            Dispatch Region: <strong style={{ color: "#0f172a" }}>{data.deliveryDistrict || "Bangladesh"}</strong>
          </p>
          <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#475569" }}>
            Fulfillment: <strong style={{ color: "#0f172a" }}>Express Doorstep Transport</strong>
          </p>
        </div>
      </div>

      {/* Itemized Table */}
      <div style={{ marginBottom: "28px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
              <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#475569", letterSpacing: "0.05em" }}>Item Description</th>
              <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#475569", letterSpacing: "0.05em", textAlign: "center" }}>Weight / Package</th>
              <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#475569", letterSpacing: "0.05em", textAlign: "center" }}>Quantity</th>
              <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#475569", letterSpacing: "0.05em", textAlign: "right" }}>Unit Rate</th>
              <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#475569", letterSpacing: "0.05em", textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>
                  {item.name}
                </td>
                <td style={{ padding: "14px", fontSize: "12px", color: "#64748b", textAlign: "center" }}>
                  {item.weight || "10kg crate"}
                </td>
                <td style={{ padding: "14px", fontSize: "12px", color: "#0f172a", fontWeight: "600", textAlign: "center" }}>
                  {item.quantity}
                </td>
                <td style={{ padding: "14px", fontSize: "12px", color: "#475569", textAlign: "right" }}>
                  ৳ {item.unitPrice.toLocaleString()}
                </td>
                <td style={{ padding: "14px", fontSize: "13px", fontWeight: "700", color: "#0f172a", textAlign: "right" }}>
                  ৳ {item.totalPrice.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Summary & Assurance Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "start", borderTop: "2px solid #e2e8f0", paddingTop: "24px", marginBottom: "32px" }}>
        
        {/* Quality Assurance Badges */}
        <div style={{ padding: "18px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ fontSize: "16px", color: "#047857" }}>✓</span>
            <strong style={{ fontSize: "12px", color: "#065f46" }}>100% Naturally Ripened & Formalin Tested</strong>
          </div>
          <p style={{ margin: "0", fontSize: "11px", color: "#047857", lineHeight: "1.4" }}>
            Handpicked directly from Rajshahi orchards. Certified carbide-free agricultural harvest. All items are weighed and securely packaged in protective ventilated crates.
          </p>
          <div style={{ marginTop: "12px", display: "flex", gap: "12px", fontSize: "10px", color: "#047857", fontWeight: "600" }}>
            <span>• Tree Fresh Guarantee</span>
            <span>• Perishable Transit Protected</span>
          </div>
        </div>

        {/* Totals Table */}
        <div style={{ backgroundColor: "#f8fafc", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
            <span>Subtotal:</span>
            <strong style={{ color: "#0f172a" }}>৳ {data.subtotal.toLocaleString()}</strong>
          </div>
          {data.discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#047857", marginBottom: "8px" }}>
              <span>Promotional Discount:</span>
              <strong>- ৳ {data.discount.toLocaleString()}</strong>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
            <span>Delivery Transport:</span>
            <strong style={{ color: "#0f172a" }}>৳ {data.deliveryCharge.toLocaleString()}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "10px" }}>
            <span>Taxes & Vat:</span>
            <strong style={{ color: "#0f172a" }}>৳ 0.00</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "800", color: "#0f172a", borderTop: "2px solid #cbd5e1", paddingTop: "10px" }}>
            <span>Total Payable:</span>
            <span style={{ color: "#047857" }}>৳ {data.total.toLocaleString()}</span>
          </div>
        </div>

      </div>

      {/* Footer / Signatory Strip */}
      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ margin: "0", fontSize: "11px", color: "#64748b" }}>
            This is a system-generated electronic document. No physical signature is required.
          </p>
          <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#94a3b8" }}>
            Thank you for ordering with MangoBite. For support or crate tracking, call +880 1700-000000.
          </p>
        </div>

        <div style={{ textAlign: "center", borderTop: "1px solid #94a3b8", paddingTop: "6px", width: "160px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#047857", display: "block" }}>
            Authorized Seal
          </span>
          <span style={{ fontSize: "9px", color: "#64748b" }}>
            MangoBite Logistics Dept.
          </span>
        </div>
      </div>
    </div>
  );
}
