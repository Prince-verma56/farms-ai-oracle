import { Html, Heading, Text, Container, Section, Button } from "@react-email/components";

export function FarmerSaleEmail({ 
  farmerName = "Farmer", 
  crop = "Crop", 
  amount = 0,
  buyerName = "A Buyer"
}: { 
  farmerName?: string; 
  crop?: string; 
  amount?: number;
  buyerName?: string;
}) {
  return (
    <Html>
      <Container style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <Heading style={{ color: "#059669" }}>Your {crop} has been sold!</Heading>
        <Text style={{ fontSize: "16px" }}>Hello {farmerName},</Text>
        <Text style={{ fontSize: "16px" }}>
          Great news! <strong>{buyerName}</strong> has purchased your listing of <strong>{crop}</strong>. 
        </Text>
        <Section style={{ background: "#f0fdf4", padding: "16px", borderRadius: "8px", margin: "20px 0" }}>
          <Text style={{ fontSize: "18px", margin: 0 }}>
            <strong>Total Transferred:</strong> ₹{amount.toFixed(2)}
          </Text>
        </Section>
        <Text style={{ fontSize: "16px" }}>
          The funds have been securely moved to your direct wallet via Razorpay Escrow.
        </Text>
        <Button href="https://farmdirect.com/admin" style={{ background: "#059669", color: "#fff", padding: "12px 24px", borderRadius: "6px", textDecoration: "none" }}>
          Check your Dashboard
        </Button>
      </Container>
    </Html>
  );
}
