import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export async function downloadInvoicePdf(elementId: string, orderId: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Invoice element not found:", elementId);
    return false;
  }

  try {
    // Generate high-resolution image
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2.5,
      backgroundColor: "#ffffff",
      cacheBust: true,
    });

    // Create A4 PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
    pdf.save(`MangoBite-Invoice-${orderId}.pdf`);
    return true;
  } catch (error) {
    console.error("PDF generation failed:", error);
    return false;
  }
}
