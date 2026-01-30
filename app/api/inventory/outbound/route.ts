// app/api/inventory/outbound/route.ts
import { lotService } from "@/lib/airtable/lot-service";
import { saleService } from "@/lib/airtable/sale-service";
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
    const formData = await request.formData();

    // Extract form fields
    const batchId = formData.get("batchId") as string;
    const weightOut = parseFloat(formData.get("weightOut") as string);
    const pieces = parseInt(formData.get("pieces") as string);
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
          error: `Insufficient stock. Available: ${lot.currentStock} kg, Requested: ${weightOut} kg`,
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
      notes: notes,
      voiceNoteUrl: voiceNoteUrl || undefined,
    });
    const updatedLot = await lotService.getByLotId(batchId);

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
