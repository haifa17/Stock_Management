import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { base64Image } = await req.json();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!, // server-side only, never exposed
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
              text: `Find the weight on this label. Reply ONLY with JSON:
{"weight": 12.5, "unit": "LBS"}
or {"weight": null, "unit": null, "error": "reason"}
Units must be LBS or KG.`,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}