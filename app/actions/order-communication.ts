"use server";

import { sendOrderConfirmation, sendFarmerAlert } from "@/lib/email-service";

export async function processOrderCommunication({
  buyerEmail,
  buyerName,
  farmerEmail,
  farmerName,
  cropName,
  amount
}: {
  buyerEmail: string;
  buyerName: string;
  farmerEmail: string;
  farmerName: string;
  cropName: string;
  amount: number;
}) {
  try {
    // 1. Send confirmation to Buyer
    await sendOrderConfirmation({
      to: buyerEmail,
      subject: `[FarmDirect] Acquisition Confirmed: ${cropName}`,
      buyerName,
      farmerName,
      orderAmount: amount,
      cropName
    });

    // 2. Alert Farmer about the new acquisition
    await sendFarmerAlert({
      to: farmerEmail,
      buyerName,
      cropName,
      amount
    });

    return { success: true };
  } catch (error) {
    console.error(`[OrderCommunication] Failed:`, error);
    return { success: false, error };
  }
}
