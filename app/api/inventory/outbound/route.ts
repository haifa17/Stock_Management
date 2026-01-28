import { lotService } from "@/lib/airtable/lot-service";
import { saleService } from "@/lib/airtable/sale-service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.batchId || !data.weightOut || !data.pieces) {
      return NextResponse.json(
        { error: "Batch ID, weight out, and pieces are required" },
        { status: 400 },
      );
    }

    // Get the lot/batch
    const lot = await lotService.getByLotId(data.batchId);
    if (!lot) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Check if enough stock available
    const weightOut = parseFloat(data.weightOut);
    if (weightOut > lot.currentStock) {
      return NextResponse.json(
        {
          error: `Insufficient stock. Available: ${lot.currentStock} kg, Requested: ${weightOut} kg`,
        },
        { status: 400 },
      );
    }

    // Create sale record
    const newSale = await saleService.create({
      lotId: data.batchId,
      weightOut: weightOut,
      pieces: parseInt(data.pieces),
      notes: data.notes || data.voiceMemo || "",
      processedBy: data.processedBy, // Optional: user ID
    });

    // Update lot stock
    const newStock = lot.currentStock - weightOut;
    await lotService.updateStock(data.batchId, newStock);

    return NextResponse.json(
      {
        sale: newSale,
        remainingStock: newStock,
        status: newStock <= 0 ? "Depleted" : "Active",
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
