// app/api/inventory/outbound/route.ts
import { lotService } from "@/lib/airtable/lot-service";
import { saleService } from "@/lib/airtable/sale-service";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import twilio from "twilio";
import { usersService } from "@/lib/airtable/users-service";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Configure Twilio
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const batchId = formData.get("batchId") as string;
    const weightOut = parseFloat(formData.get("weightOut") as string);
    const pieces = parseInt(formData.get("pieces") as string);
    const price = parseInt(formData.get("price") as string);
    const client = formData.get("client") as string;
    const notes = formData.get("notes") as string;
    const voiceNote = formData.get("voiceNote") as File | null;

    // Validate required fields
    if (!batchId || !weightOut || !pieces) {
      return NextResponse.json(
        { error: "Batch ID, weight out, and pieces are required" },
        { status: 400 },
      );
    }

    // Get the lot/batch
    const lot = await lotService.getByLotId(batchId);
    if (!lot) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Check if enough stock available
    if (weightOut > lot.currentStock) {
      return NextResponse.json(
        {
          error: `Insufficient stock. Available: ${lot.currentStock} £, Requested: ${weightOut} £`,
        },
        { status: 400 },
      );
    }

    let voiceNoteUrl = null;

    // Upload voice note to Cloudinary if present
    if (voiceNote && voiceNote.size > 0) {
      console.log("Voice note detected, starting upload...");
      try {
        const bytes = await voiceNote.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Audio = buffer.toString("base64");
        const dataURI = `data:${voiceNote.type};base64,${base64Audio}`;
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          resource_type: "video", // Audio files use "video" resource type
          folder: "voice-notes",
          public_id: `voice-note-${batchId}-${Date.now()}`,
          format: "webm",
        });

        voiceNoteUrl = uploadResponse.secure_url;
        console.log("✓ Voice note uploaded successfully:", voiceNoteUrl);
      } catch (uploadError) {
        console.error("Error uploading voice note:", uploadError);
        // Continue without voice note rather than failing the entire request
      }
    }
    console.log("Creating sale with voiceNoteUrl:", voiceNoteUrl);

    // Create sale record with voice note URL
    const newSale = await saleService.create({
      lotId: batchId,
      weightOut: weightOut,
      pieces: pieces,
      price: price,
      client: client,
      notes: notes,
      voiceNoteUrl: voiceNoteUrl || undefined,
    });
    const updatedLot = await lotService.getByLotId(batchId);
    // Send WhatsApp notification about the sale
    await sendSaleNotification(newSale, lot, updatedLot, voiceNoteUrl);
    return NextResponse.json(
      {
        sale: newSale,
        lot: updatedLot,
        voiceNoteUrl: voiceNoteUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error processing outbound:", error);
    return NextResponse.json(
      {
        error: "Failed to process outbound",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
// Helper function to send sale notification via Twilio WhatsApp
async function sendSaleNotification(
  sale: any,
  originalLot: any,
  updatedLot: any,
  voiceNoteUrl: string | null,
) {
  // Check if Twilio is configured
  if (!twilioClient) {
    console.warn("⚠️ Twilio not configured - skipping WhatsApp notification");
    return;
  }

  // Get all users who want WhatsApp notifications
  const recipients = await usersService.getWhatsAppRecipients();

  // Choose who to notify (or send to both!)
  const twilioWhatsAppNumber =
    process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

  if (recipients.length === 0) {
    console.warn("⚠️ No users configured to receive WhatsApp notifications");
    return;
  }

  console.log(
    `📱 Sending sale notifications to ${recipients.length} recipient(s)`,
  );
  console.log("📱 Sending outbound WhatsApp notification for sale:", sale.id);

  try {
    // Calculate percentage sold
    const percentageSold = (
      (sale.weightOut / originalLot.qtyReceived) *
      100
    ).toFixed(1);
    const remainingPercentage = (
      (updatedLot.currentStock / originalLot.qtyReceived) *
      100
    ).toFixed(1);

    // Format the message
    const messageBody = `
📤 *Sale Processed - Outbound*

🆔 *Sale ID:* ${sale.id}
📦 *Lot ID:* ${sale.lotId}
🏷️ *Product:* ${originalLot.product}

📊 *Sale Details:*
👤 Client Name: ${sale.client} 
⚖️ Weight Out: ${sale.weightOut} £
🔢 Pieces: ${sale.pieces}
💸 Proposed Sales Price: ${sale.price}
💰 Sold: ${percentageSold}% of lot

📈 *Stock Status:*
Before: ${originalLot.currentStock} £
After: ${updatedLot.currentStock} £ (${remainingPercentage}% remaining)
${updatedLot.currentStock <= 0 ? "⚠️ *LOT DEPLETED*" : ""}

📝 *Notes:* ${sale.notes || "None"}
${voiceNoteUrl ? `\n🎤 *Voice Note:* ${voiceNoteUrl}` : ""}

⏰ ${new Date().toLocaleString()}
    `.trim();

    const sendPromises = recipients.map(async (user) => {
      if (!user.phone) {
        console.warn(`⚠️ User ${user.email} has no phone number`);
        return { success: false, user: user.email };
      }
      try {
        const phone = user.phone.startsWith("whatsapp:")
          ? user.phone
          : `whatsapp:${user.phone}`;

        const message = await twilioClient.messages.create({
          from: twilioWhatsAppNumber,
          to: phone,
          body: messageBody,
        });

        console.log(`✓ Notification sent to ${user.email} (${user.phone})`);
        console.log(`  Message SID: ${message.sid}`);
        return { success: true, user: user.email, sid: message.sid };
      } catch (error) {
        console.error(
          `✗ Failed to send to ${user.email} (${user.phone}):`,
          error,
        );
        if (error && typeof error === "object" && "code" in error) {
          console.error("  Twilio Error Code:", error.code);
        }
        return { success: false, user: user.email, error };
      }
    });

    // Wait for all messages to send
    const results = await Promise.allSettled(sendPromises);
    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.success,
    ).length;
    console.log(
      `✓ Sent ${successCount}/${recipients.length} notifications successfully`,
    );

    // Optional: Send low stock alert if remaining is below threshold
    if (
      updatedLot.currentStock > 0 &&
      updatedLot.currentStock <= originalLot.qtyReceived * 0.2
    ) {
      await sendLowStockAlert(updatedLot, recipients, twilioWhatsAppNumber);
    }
  } catch (error) {
    console.error("✗ Failed to send outbound WhatsApp notification:", error);
    if (error && typeof error === "object" && "code" in error) {
      console.error("Twilio Error Code:", error.code);
    }
  }
}

// Optional: Send low stock alert
async function sendLowStockAlert(
  lot: any,
  recipients: any[],
  twilioWhatsAppNumber: string,
) {
  if (!twilioClient) return;

  const remainingPercentage = (
    (lot.currentStock / lot.qtyReceived) *
    100
  ).toFixed(1);

  const alertMessage = `
⚠️ *LOW STOCK ALERT*

📦 *Lot ID:* ${lot.lotId}
🏷️ *Product:* ${lot.product}
📊 *Remaining:* ${lot.currentStock} £ (${remainingPercentage}%)

🔔 This lot is running low. Consider reordering soon!
  `.trim();

  const sendPromises = recipients.map(async (user) => {
    if (!user.phone) return;

    try {
      const phone = user.phone.startsWith("whatsapp:")
        ? user.phone
        : `whatsapp:${user.phone}`;

      await twilioClient.messages.create({
        from: twilioWhatsAppNumber,
        to: phone,
        body: alertMessage,
      });

      console.log(`✓ Low stock alert sent to ${user.email}`);
    } catch (error) {
      console.error(`✗ Failed to send alert to ${user.email}:`, error);
    }
  });

  await Promise.allSettled(sendPromises);
}
