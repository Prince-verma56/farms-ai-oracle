import { Resend } from "resend";
import { WelcomeEmail } from "@/app/features/emails/components/WelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (email: string, name: string, role: string) => {
  if (!process.env.RESEND_API_KEY) {
    return {
      success: false as const,
      error: { message: "RESEND_API_KEY is missing.", name: "missing_api_key", statusCode: 500 },
    };
  }

  // --- HACKATHON WORKAROUND ---
  const demoRecipient = "devincreator123@gmail.com"; 

  try {
    const { data, error } = await resend.emails.send({
      from: "FarmDirect <onboarding@resend.dev>", 
      to: [demoRecipient], // Changed from [email] to [demoRecipient]
      subject: `Welcome to the Marketplace, ${name}!`, // Added name for a personal touch
      react: WelcomeEmail({ name, role }),
    });

    if (error || !data?.id) {
      return {
        success: false as const,
        error: error ?? { message: "Email provider returned no id.", name: "application_error", statusCode: 500 },
      };
    }

    return { success: true as const, data };
  } catch (error) {
    console.error("Resend Error:", error);
    return { success: false, error };
  }
};