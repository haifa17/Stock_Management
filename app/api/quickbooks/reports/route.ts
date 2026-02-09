// app/api/quickbooks/reports/route.ts
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

    // Get Profit & Loss report for last 30 days
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const report = await qbClient.getProfitAndLoss(startDate, endDate);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
