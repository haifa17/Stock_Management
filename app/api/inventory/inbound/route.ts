//api/inventory/inbound
import { lotService } from "@/lib/airtable/lot-service";
import { productService } from "@/lib/airtable/product-service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Received inbound data:", data);
    // Validate required fields
    if (!data.product || !data.lotId || !data.qtyReceived) {
      return NextResponse.json(
        { error: "Product, lotId, and qtyReceived are required" },
        { status: 400 },
      );
    }

    // Verify product exists
    const product = await productService.getByName(data.product);
    if (!product) {
      console.error("Product not found:", data.product);
      return NextResponse.json(
        {
          error: `Product "${data.product}" not found. Please create the product first.`,
        },
        { status: 404 },
      );
    }

    // Create lot/batch record
    const newLot = await lotService.create({
      lotId: data.lotId,
      product: data.product,
      provider: data.provider,
      grade: data.grade,
      brand: data.brand,
      origin: data.origin,
      condition: data.condition,
      productionDate: data.productionDate,
      qtyReceived: data.qtyReceived,
      status: "Active",
      notes: data.notes || data.voiceMemo || "",
      createdBy: data.createdBy, // Optional: user ID
    });
    console.log("Lot created successfully:", newLot);

    // TODO: Send WhatsApp notification to marketer
    // await sendMarketerNotification(newLot);

    return NextResponse.json(newLot, { status: 201 });
  } catch (error) {
    console.error("Error creating inbound batch:", error);
    return NextResponse.json(
      { error: "Failed to create inbound batch" },
      { status: 500 },
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
