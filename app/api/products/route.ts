import { productService } from "@/lib/airtable/product-service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await productService.getAll();
    
    // Return just the product names as strings (for the dropdown)
    const productNames = products.map(p => p.name);
    
    return NextResponse.json(productNames);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json(
        { error: "Product already exists" },
        { status: 409 }
      );
    }

    // Create the product
    const newProduct = await productService.create({
      name: data.name,
      category: data.category,
      type: data.type ,
      isEmergency: false,
      createdBy: data.createdBy, // Optional: pass user ID
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}