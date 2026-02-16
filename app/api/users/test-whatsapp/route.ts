import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import twilio from "twilio";

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!twilioClient) {
      return NextResponse.json(
        { error: "Twilio not configured" },
        { status: 500 }
      );
    }

    if (!currentUser.phone) {
      return NextResponse.json(
        { error: "Phone number not found. Please update your settings first." },
        { status: 404 }
      );
    }

    const twilioWhatsAppNumber =
      process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

    const phone = currentUser.phone.startsWith("whatsapp:")
      ? currentUser.phone
      : `whatsapp:${currentUser.phone}`;

    const testMessage = `
🧪 *Test WhatsApp Notification*

✅ Your WhatsApp notifications are working!

You will receive updates for:
📤 Sales transactions
⚠️ Low stock alerts
📊 Inventory updates

⏰ ${new Date().toLocaleString()}
    `.trim();

    await twilioClient.messages.create({
      from: twilioWhatsAppNumber,
      to: phone,
      body: testMessage,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending test message:", error);
    return NextResponse.json(
      { error: "Failed to send test message" },
      { status: 500 }
    );
  }
}