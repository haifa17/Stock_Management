import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { base64Image } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: base64Image },
              },
              {
                type: "text",
                text: `Find the weight on this shipping or product label.
Reply with ONLY a raw JSON object, no markdown, no backticks, no explanation:
{"weight": 12.5, "unit": "LBS"}
If no weight found:
{"weight": null, "unit": null, "error": "not found"}
Units must be LBS or KG only.`,
              },
            ],
          },
        ],
      }),
    });

    const raw = await response.text(); // use text() first so we always see what came back

    if (!response.ok) {
      return NextResponse.json(
        { error: `Anthropic API error ${response.status}`, detail: raw.substring(0, 300) },
        { status: 500 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Anthropic returned invalid JSON", detail: raw.substring(0, 300) },
        { status: 500 }
      );
    }

    const claudeText = data.content?.[0]?.text ?? "";

    return NextResponse.json({ claudeText });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}