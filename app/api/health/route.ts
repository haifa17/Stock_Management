import Airtable from "airtable";
import { NextResponse } from "next/server";

// Configure Airtable client
const base = new Airtable({ apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN }).base(
  process.env.AIRTABLE_BASE_ID || ""
);

async function checkDependencies() {
  try {
    // Ping Airtable by fetching just 1 record from your inventory table
    const records = await base("Inventory")
      .select({ maxRecords: 1 })
      .firstPage();

    // If we got a response, Airtable is reachable
    const airtableOk = Array.isArray(records);

    return { airtableOk };
  } catch (err) {
    console.error("Airtable check failed:", err);
    return { airtableOk: false };
  }
}

export async function GET() {
  const { airtableOk } = await checkDependencies();

  if (!airtableOk) {
    return NextResponse.json(
      {
        status: "unavailable",
        uptime: process.uptime(),
        airtable: "down",
      },
      { status: 503 } // Service Unavailable
    );
  }

  return NextResponse.json(
    {
      status: "ok",
      uptime: process.uptime(),
      airtable: "ok",
    },
    { status: 200 }
  );
}
