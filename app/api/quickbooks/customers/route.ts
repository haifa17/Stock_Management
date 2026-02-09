// app/api/quickbooks/customers/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getQuickBooksClient } from "@/lib/quickbooks/client";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || !user.qb_connected || !user.qb_access_token) {
      return NextResponse.json(
        { error: "QuickBooks not connected" },
        { status: 400 },
      );
    }

    const qbClient = getQuickBooksClient({
      accessToken: user.qb_access_token,
      refreshToken: user.qb_refresh_token!,
      realmId: user.qb_realm_id!,
    });

    // Query customers
    const result = await qbClient.queryItems(
      "SELECT * FROM Customer MAXRESULTS 50",
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
