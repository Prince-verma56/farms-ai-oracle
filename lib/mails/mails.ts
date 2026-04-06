import { Resend } from "resend";
import { WelcomeEmail } from "@/app/features/emails/components/WelcomeEmail";
import { FarmerSaleEmail } from "@/app/features/emails/components/FarmerSaleEmail";
import { BuyerReceiptEmail } from "@/app/features/emails/components/BuyerReceiptEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// --- HACKATHON WORKAROUND ---
const demoRecipient = "devincreator123@gmail.com"; 

export const sendWelcomeEmail = async (email: string, name: string, role: string) => {
  if (!process.env.RESEND_API_KEY) return { success: false, error: "RESEND_API_KEY is missing." };
  try {
    const { data, error } = await resend.emails.send({
      from: "FarmDirect <onboarding@resend.dev>", 
      to: [demoRecipient],
      subject: `Welcome to the Marketplace, ${name}!`,
      react: WelcomeEmail({ name, role }),
    });
    if (error || !data?.id) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};

export const sendFarmerSaleAlert = async (farmerEmail: string, farmerName: string, crop: string, amount: number, buyerName: string) => {
  if (!process.env.RESEND_API_KEY) return { success: false };
  try {
    const { data, error } = await resend.emails.send({
      from: "FarmDirect Alerts <alerts@resend.dev>", 
      to: [demoRecipient], // Farmer email spoofed
      subject: `Cha-ching! Your ${crop} has been sold!`,
      react: FarmerSaleEmail({ farmerName, crop, amount, buyerName }),
    });
    return { success: !error, data };
  } catch (e) {
    return { success: false };
  }
};

export const sendBuyerReceiptEmail = async (buyerEmail: string, buyerName: string, crop: string, amount: number, savings: string) => {
  if (!process.env.RESEND_API_KEY) return { success: false };
  try {
    const { data, error } = await resend.emails.send({
      from: "FarmDirect Receipts <receipts@resend.dev>", 
      to: [demoRecipient], // Buyer email spoofed
      subject: `Receipt: Your purchase of ${crop}`,
      react: BuyerReceiptEmail({ buyerName, crop, amount, savings }),
    });
    return { success: !error, data };
  } catch (e) {
    return { success: false };
  }
};