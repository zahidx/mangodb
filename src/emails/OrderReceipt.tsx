import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OrderReceiptProps {
  orderId?: string;
  customerName?: string;
  total?: number;
  productName?: string;
  shippingAddress?: string;
}

export const OrderReceipt = ({
  orderId = "MNG-123456",
  customerName = "Valued Customer",
  total = 1500,
  productName = "Premium Rajshahi Himsagar (10kg)",
  shippingAddress = "Dhaka, Bangladesh",
}: OrderReceiptProps) => {
  const previewText = `Your MangoDB Order ${orderId} is confirmed!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>MangoDB</Text>
          </Section>

          <Section style={content}>
            <Heading style={heading}>Thank you for your order!</Heading>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>
              We've received your order and are currently preparing it for harvest
              from our Rajshahi orchards. We will notify you once it has been
              shipped.
            </Text>

            <Hr style={divider} />

            <Heading style={subHeading}>Order Details</Heading>
            <Text style={text}>
              <strong>Order ID:</strong> {orderId}
            </Text>
            <Text style={text}>
              <strong>Item:</strong> {productName}
            </Text>
            <Text style={text}>
              <strong>Shipping to:</strong> {shippingAddress}
            </Text>

            <Hr style={divider} />

            <Section style={priceSection}>
              <Text style={priceText}>
                <strong>Total Amount:</strong> ৳{total}
              </Text>
            </Section>

            <Text style={text}>
              You can track your order directly from your dashboard using the Crate ID.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              MangoDB — Premium Rajshahi Mangoes
              <br />
              100% Carbide-Free & Farm Fresh
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderReceipt;

const main = {
  backgroundColor: "#f2f7f4",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "580px",
  maxWidth: "100%",
};

const header = {
  padding: "24px",
  backgroundColor: "#059669",
  borderRadius: "12px 12px 0 0",
  textAlign: "center" as const,
};

const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: "0",
  letterSpacing: "1px",
};

const content = {
  padding: "32px 24px",
  backgroundColor: "#ffffff",
  borderRadius: "0 0 12px 12px",
  border: "1px solid #e5e7eb",
  borderTop: "none",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: "#111827",
  margin: "0 0 24px",
};

const subHeading = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#374151",
  margin: "24px 0 12px",
};

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0 0 16px",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const priceSection = {
  backgroundColor: "#f3f4f6",
  padding: "16px",
  borderRadius: "8px",
  marginBottom: "24px",
};

const priceText = {
  fontSize: "18px",
  color: "#111827",
  margin: "0",
  textAlign: "right" as const,
};

const footer = {
  padding: "32px 24px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#6b7280",
};
