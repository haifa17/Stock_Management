import { productService } from "@/lib/airtable/product-service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    // Check if product already exists
    const existingProduct = await productService.getByName(data.name);
    if (existingProduct) {
      // Return existing product if found
      return NextResponse.json(existingProduct);
    }

    // Create emergency product
    const newProduct = await productService.create({
      name: data.name,
      category: data.category,
      type: data.type || "primal",
      isEmergency: true, // Mark as emergency
      createdBy: data.createdBy, // Optional: pass user ID
    });

    // // TODO: Send notification to admin
    // if (data.alertAdmin) {
    //   await sendAdminAlert(newProduct);
    // }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating emergency product:", error);
    return NextResponse.json(
      { error: "Failed to create emergency product" },
      { status: 500 }
    );
  }
}

// Helper function to send admin alert
// async function sendAdminAlert(product: any) {
  // TODO: Implement WhatsApp/Email notification
  // This could use Twilio, Make.com webhook, or other notification service
  // console.log("🚨 ADMIN ALERT: Emergency product created:", product.name);
  
  // Example: Send to Make.com webhook
//   try {
//     await fetch(process.env.MAKE_WEBHOOK_URL || "", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         type: "emergency_product",
//         product: product.name,
//         category: product.category,
//         timestamp: new Date().toISOString(),
//       }),
//     });
//   } catch (error) {
//     console.error("Failed to send admin alert:", error);
//   }
// }