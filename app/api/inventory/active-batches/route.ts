import { lotService } from "@/lib/airtable/lot-service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const activeBatches = await lotService.getActiveBatches();
    return NextResponse.json(activeBatches);
  } catch (error) {
    console.error("Error fetching active batches:", error);
    return NextResponse.json(
      { error: "Failed to fetch active batches" },
      { status: 500 }
    );
  }
}