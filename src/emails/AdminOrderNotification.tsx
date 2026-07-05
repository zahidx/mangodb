import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";

interface AdminOrderNotificationProps {
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  total?: number;
  productName?: string;
  shippingAddress?: string;
  paymentMethod?: string;
}

export const AdminOrderNotification = ({
  orderId = "MNG-123456",
  customerName = "Valued Customer",
  customerEmail = "customer@example.com",
  customerPhone = "N/A",
  total = 1500,
  productName = "Premium Rajshahi Himsagar (10kg)",
  shippingAddress = "Dhaka, Bangladesh",
  paymentMethod = "Cash on Delivery",
}: AdminOrderNotificationProps) => {
  const previewText = `New Order Received: ${orderId} from ${customerName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>MangoDB</Text>
            <Text style={badge}>NEW ORDER — Admin Notification</Text>
          </Section>

          <Section style={content}>
            <Heading style={heading}>🛵 New Order Received!</Heading>
            <Text style={text}>
              A new order has been placed and requires your attention.
            </Text>

            <Hr style={divider} />

            <Heading style={subHeading}>Order Summary</Heading>
            <Text style={text}>
              <strong>Order ID:</strong> {orderId}
            </Text>
            <Text style={text}>
              <strong>Item:</strong> {productName}
            </Text>
            <Text style={text}>
              <strong>Total:</strong> ৳{total}
            </Text>
            <Text style={text}>
              <strong>Payment:</strong> {paymentMethod}
            </Text>

            <Hr style={divider} />

            <Heading style={subHeading}>Customer Details</Heading>
            <Text style={text}>
              <strong>Name:</strong> {customerName}
            </Text>
            <Text style={text}>
              <strong>Email:</strong> {customerEmail}
            </Text>
            <Text style={text}>
              <strong>Phone:</strong> {customerPhone}
            </Text>
            <Text style={text}>
              <strong>Shipping Address:</strong> {shippingAddress}
            </Text>

            <Hr style={divider} />

            <Section style={actionSection}>
              <Text style={actionText}>
                ⚡ Please process this order and arrange harvest & delivery.
              </Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              MangoDB — Admin Notification System
              <br />
              This email was sent automatically when a new order was placed.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminOrderNotification;

const main = {
  backgroundColor: "#1a1a2e",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const header = {
  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  padding: "32px 24px",
  textAlign: "center" as const,
  borderRadius: "12px 12px 0 0",
};

const logoText = {
  fontSize: "28px",
  fontWeight: "900",
  color: "#fbbf24",
  letterSpacing: "2px",
  margin: "0",
};

const badge = {
  fontSize: "11px",
  fontWeight: "700",
  color: "#fbbf24",
  backgroundColor: "rgba(251, 191, 36, 0.15)",
  padding: "6px 16px",
  borderRadius: "20px",
  display: "inline-block",
  marginTop: "8px",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

const content = {
  backgroundColor: "#ffffff",
  padding: "32px 24px",
};

const heading = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#1a1a2e",
  margin: "0 0 16px",
};

const subHeading = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#1a1a2e",
  margin: "0 0 12px",
};

const text = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#333",
  margin: "6px 0",
};

const divider = {
  borderColor: "#e6ebec",
  margin: "24px 0",
};

const priceSection = {
  backgroundColor: "#f0fdf4",
  padding: "16px",
  borderRadius: "8px",
  textAlign: "center" as const,
};

const priceText = {
  fontSize: "18px",
  fontWeight: "800",
  color: "#166534",
  margin: "0",
};

const actionSection = {
  backgroundColor: "#fefce8",
  padding: "16px",
  borderRadius: "8px",
  borderLeft: "4px solid #fbbf24",
};

const actionText = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#854d0e",
  margin: "0",
};

const footer = {
  backgroundColor: "#f8fafc",
  padding: "20px 24px",
  textAlign: "center" as const,
  borderRadius: "0 0 12px 12px",
};

const footerText = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "0",
  lineHeight: "20px",
};
