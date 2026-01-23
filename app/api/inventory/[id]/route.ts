import { NextRequest, NextResponse } from "next/server";
import { inventoryService } from "@/lib/airtable/inventory-service";

// PATCH - Mettre à jour un item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Si seul le statut est fourni, utiliser updateStatus
    const updated = await inventoryService.updateStatus(id, status);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/inventory/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour" },
      { status: 500 },
    );
  }
}

// DELETE - Supprimer un item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await inventoryService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/inventory/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression" },
      { status: 500 },
    );
  }
}
