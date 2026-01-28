import { NextResponse } from "next/server";
import { inventoryService } from "@/lib/airtable/inventory-service";

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  try {
    const params = await context.params;
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const data = await request.json();
    console.log("PATCH data received:", data, "params.id:", id);

    if (!data.status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }
    const updatedItem = await inventoryService.updateStatus(id, data.status);

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating inventory status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const item = await inventoryService.getById(params.id);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 },
    );
  }
}
