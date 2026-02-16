//api/inventory/inbound/route.ts
import { lotService } from "@/lib/airtable/lot-service";
import { productService } from "@/lib/airtable/product-service";
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
    console.log("=== INBOUND API CALLED ===");

    const formData = await request.formData();
    console.log("FormData received");

    // Extract form fields
    const product = formData.get("product") as string;
    const lotId = formData.get("lotId") as string;
    const qtyReceived = parseFloat(formData.get("qtyReceived") as string);
    const price = parseFloat(formData.get("price") as string);
    const provider = formData.get("provider") as string;
    const grade = formData.get("grade") as string;
    const brand = formData.get("brand") as string;
    const origin = formData.get("origin") as string;
    const condition = formData.get("condition") as string;
    const productionDate = formData.get("productionDate") as string;
    const expirationDate = formData.get("expirationDate") as string;
    const notes = formData.get("notes") as string;
    const voiceNote = formData.get("voiceNote") as File | null;
    const invoice = formData.get("invoice") as File | null;
    const createdBy = formData.get("createdBy") as string;

    console.log("Extracted fields:", {
      product,
      lotId,
      qtyReceived,
      price,
      voiceNoteExists: !!voiceNote,
      voiceNoteSize: voiceNote?.size,
    });

    // Validate required fields
    if (!product || !lotId || !qtyReceived) {
      return NextResponse.json(
        { error: "Product, lotId, and qtyReceived are required" },
        { status: 400 },
      );
    }

    // Verify product exists
    const productRecord = await productService.getByName(product);
    if (!productRecord) {
      console.error("Product not found:", product);
      return NextResponse.json(
        {
          error: `Product "${product}" not found. Please create the product first.`,
        },
        { status: 404 },
      );
    }

    let voiceNoteUrl = null;
    let invoiceUrl = null;
    // Upload voice note to Cloudinary if present
    if (voiceNote && voiceNote.size > 0) {
      console.log("Voice note detected, starting upload...");

      try {
        // Check Cloudinary config
        console.log("Cloudinary config:", {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✓ Set" : "✗ Missing",
          api_key: process.env.CLOUDINARY_API_KEY ? "✓ Set" : "✗ Missing",
          api_secret: process.env.CLOUDINARY_API_SECRET ? "✓ Set" : "✗ Missing",
        });

        const bytes = await voiceNote.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Audio = buffer.toString("base64");
        const dataURI = `data:${voiceNote.type};base64,${base64Audio}`;

        console.log("Audio prepared for upload, size:", buffer.length, "bytes");

        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          resource_type: "video", // Audio files use "video" resource type
          folder: "voice-notes/inbound",
          public_id: `inbound-${lotId}-${Date.now()}`,
          format: "webm",
        });

        voiceNoteUrl = uploadResponse.secure_url;
        console.log("✓ Voice note uploaded successfully:", voiceNoteUrl);
      } catch (uploadError) {
        console.error("✗ Error uploading voice note:", uploadError);
        // Continue without voice note rather than failing the entire request
      }
    } else {
      console.log("No voice note in request");
    }
    // Upload invoice to Cloudinary if present
    if (invoice && invoice.size > 0) {
      console.log("Invoice detected, starting upload...");
      console.log("Invoice type:", invoice.type);
      console.log("Invoice size:", invoice.size);

      try {
        const bytes = await invoice.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64File = buffer.toString("base64");

        // Determine resource type based on file type
        const isPDF = invoice.type === "application/pdf";
        const mimeType = isPDF ? "application/pdf" : invoice.type;
        const dataURI = `data:${mimeType};base64,${base64File}`;

        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          resource_type: isPDF ? "raw" : "image",
          folder: "invoices/inbound",
          public_id: `invoice-${lotId}-${Date.now()}`,
          format: isPDF ? "pdf" : undefined,
          access_mode: "public",
          type: "upload",
        });

        invoiceUrl = uploadResponse.secure_url;
        console.log("✓ Invoice uploaded successfully:", invoiceUrl);
      } catch (uploadError) {
        console.error("✗ Error uploading invoice:", uploadError);
        // Continue without invoice rather than failing the entire request
      }
    }

    console.log("Creating lot with voiceNoteUrl:", voiceNoteUrl);
    console.log("Creating lot with invoiceUrl:", invoiceUrl);

    // Create lot/batch record
    const newLot = await lotService.create({
      lotId: lotId,
      product: product,
      provider: provider,
      grade: grade,
      brand: brand,
      origin: origin,
      condition: condition,
      productionDate: productionDate,
      expirationDate: expirationDate,
      price: price,
      qtyReceived: qtyReceived,
      status: "Available",
      notes: notes || "",
      voiceNoteUrl: voiceNoteUrl || undefined,
      invoiceUrl: invoiceUrl || undefined,
      createdBy: createdBy,
    });

    console.log("Lot created successfully:", newLot);
    // Send WhatsApp notification to marketer
    await sendMarketerNotification(newLot, voiceNoteUrl, invoiceUrl);

    return NextResponse.json(
      {
        ...newLot,
        voiceNoteUrl: voiceNoteUrl,
        invoiceUrl: invoiceUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("=== ERROR IN INBOUND API ===");
    console.error("Error creating inbound batch:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    return NextResponse.json(
      {
        error: "Failed to create inbound batch",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// Helper function to send marketer notification via Twilio WhatsApp
async function sendMarketerNotification(
  lot: any,
  voiceNoteUrl: string | null,
  invoiceUrl: string | null,
) {
  // Check if Twilio is configured
  if (!twilioClient) {
    console.warn("⚠️ Twilio not configured - skipping WhatsApp notification");
    console.warn("Missing: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
    return;
  }

  const recipients = await usersService.getWhatsAppRecipients();
  const twilioWhatsAppNumber =
    process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"; // Default sandbox

  if (recipients.length === 0) {
    console.warn("⚠️ No users configured to receive WhatsApp notifications");
    return;
  }

  console.log("📱 Sending WhatsApp notification for lot:", lot.lotId);
  // Format the message
  const messageBody = `
🚚 *New Inventory Arrival*

📦 *Lot ID:* ${lot.lotId}
🏷️ *Product:* ${lot.product}
📊 *Quantity:* ${lot.qtyReceived}
💸 *Price:* ${lot.price}
👤 *Provider:* ${lot.provider || "N/A"}
⭐ *Grade:* ${lot.grade || "N/A"}
🏭 *Brand:* ${lot.brand || "N/A"}
🌍 *Origin:* ${lot.origin || "N/A"}
✅ *Condition:* ${lot.condition || "N/A"}
📅 *Production Date:* ${lot.productionDate || "N/A"}
📅 *Expiration Date:* ${lot.expirationDate || "N/A"}
📝 *Notes:* ${lot.notes || "None"}
${voiceNoteUrl ? `\n🎤 *Voice Note:* ${voiceNoteUrl}` : ""}
${invoiceUrl ? `\n🧾 *Invoice:* ${invoiceUrl}` : ""}
⏰ ${new Date().toLocaleString()}
    `.trim();

  // Send to all recipients
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

      console.log(
        `✓ Inbound notification sent to ${user.email} (${user.phone})`,
      );
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
    `✓ Sent ${successCount}/${recipients.length} inbound notifications successfully`,
  );
}
