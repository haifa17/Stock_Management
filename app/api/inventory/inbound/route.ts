//api/inventory/inbound/route.ts
import { lotService } from "@/lib/airtable/lot-service";
import { productService } from "@/lib/airtable/product-service";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    console.log("=== INBOUND API CALLED ===");
    
    const formData = await request.formData();
    console.log("FormData received");

    // Extract form fields
    const product = formData.get("product") as string;
    const lotId = formData.get("lotId") as string;
    const qtyReceived = parseFloat(formData.get("qtyReceived") as string);
    const provider = formData.get("provider") as string;
    const grade = formData.get("grade") as string;
    const brand = formData.get("brand") as string;
    const origin = formData.get("origin") as string;
    const condition = formData.get("condition") as string;
    const productionDate = formData.get("productionDate") as string;
    const notes = formData.get("notes") as string;
    const voiceNote = formData.get("voiceNote") as File | null;
    const createdBy = formData.get("createdBy") as string;

    console.log("Extracted fields:", {
      product,
      lotId,
      qtyReceived,
      voiceNoteExists: !!voiceNote,
      voiceNoteSize: voiceNote?.size,
    });

    // Validate required fields
    if (!product || !lotId || !qtyReceived) {
      return NextResponse.json(
        { error: "Product, lotId, and qtyReceived are required" },
        { status: 400 }
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
        { status: 404 }
      );
    }

    let voiceNoteUrl = null;

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

    console.log("Creating lot with voiceNoteUrl:", voiceNoteUrl);

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
      qtyReceived: qtyReceived,
      status: "Active",
      notes: notes || "",
      voiceNoteUrl: voiceNoteUrl || undefined,
      createdBy: createdBy,
    });
    
    console.log("Lot created successfully:", newLot);

    // TODO: Send WhatsApp notification to marketer
    // await sendMarketerNotification(newLot);

    return NextResponse.json({
      ...newLot,
      voiceNoteUrl: voiceNoteUrl,
    }, { status: 201 });
  } catch (error) {
    console.error("=== ERROR IN INBOUND API ===");
    console.error("Error creating inbound batch:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { 
        error: "Failed to create inbound batch",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Helper function to send marketer notification
// async function sendMarketerNotification(lot: any) {
// TODO: Implement WhatsApp notification via Make.com or Twilio
// console.log("📱 MARKETER NOTIFICATION: New arrival -", lot.lotId);

// try {
//   await fetch(process.env.MAKE_WEBHOOK_MARKETER_URL || "", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       type: "new_arrival",
//       lotId: lot.lotId,
//       product: lot.product,
//       quantity: lot.qtyReceived,
//       provider: lot.provider,
//       grade: lot.grade,
//       timestamp: new Date().toISOString(),
//     }),
//   });
// } catch (error) {
//   console.error("Failed to send marketer notification:", error);
// }
//}