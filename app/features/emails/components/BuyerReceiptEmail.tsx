import { Html, Heading, Text, Container, Section, Hr } from "@react-email/components";

export function BuyerReceiptEmail({ 
  buyerName = "Buyer", 
  crop = "Crop", 
  amount = 0,
  savings = "Unknown"
}: { 
  buyerName?: string; 
  crop?: string; 
  amount?: number;
  savings?: string;
}) {
  return (
    <Html>
      <Container style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <Heading style={{ color: "#4f46e5" }}>Order Receipt: {crop}</Heading>
        <Text style={{ fontSize: "16px" }}>Hi {buyerName},</Text>
        <Text style={{ fontSize: "16px" }}>
          Thank you for purchasing <strong>{crop}</strong> directly from the source!
        </Text>
        <Section style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", margin: "20px 0" }}>
          <Text style={{ fontSize: "16px", margin: "0 0 8px" }}>
            <strong>Amount Paid:</strong> ₹{amount.toFixed(2)}
          </Text>
          <Text style={{ fontSize: "16px", color: "#059669", margin: 0 }}>
            <strong>Price Protection Savings:</strong> {savings} vs Mandi
          </Text>
        </Section>
        <Hr style={{ borderColor: "#e2e8f0", margin: "20px 0" }} />
        <Text style={{ fontSize: "14px", color: "#64748b" }}>
          Powered by FarmDirect & Razorpay.
        </Text>
      </Container>
    </Html>
  );
}
