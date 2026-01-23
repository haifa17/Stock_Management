import { NextRequest, NextResponse } from "next/server";
import { ordersService } from "@/lib/airtable/orders-service";

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
    const updated = await ordersService.updateStatus(id, status);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH /api/order/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour" },
      { status: 500 },
    );
  }
}


