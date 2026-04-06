import { NextResponse } from "next/server";
import { sendBuyerReceiptEmail, sendFarmerSaleAlert } from "@/lib/mails/mails";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { buyerName, buyerEmail, crop, buyerPrice, savings, farmerName } = body;

    // Send successful purchase receipt via Resend
    if (buyerEmail) {
      await sendBuyerReceiptEmail(buyerEmail, buyerName || "Buyer", crop || "Crop", buyerPrice || 0, savings || "Unknown");
    }
    
    // Notify the farmer that order arrived
    await sendFarmerSaleAlert("farmer@example.com", farmerName || "Farmer", crop || "Crop", buyerPrice || 0, buyerName || "Buyer");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
