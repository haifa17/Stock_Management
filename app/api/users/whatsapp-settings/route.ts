import { usersService } from "@/lib/airtable/users-service";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// GET current settings
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      phone: currentUser.phone || "",
      receiveNotifications: currentUser.receiveWhatsAppNotifications || false,
    });
  } catch (error) {
    console.error("Error fetching WhatsApp settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// UPDATE settings
export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phone, receiveNotifications } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    await usersService.updateWhatsAppPreferences(
      currentUser.id,
      phone,
      receiveNotifications
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating WhatsApp settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}