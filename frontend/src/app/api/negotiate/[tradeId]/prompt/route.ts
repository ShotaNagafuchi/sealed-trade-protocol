import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { apiKey, systemPrompt, messages } = await request.json();

  if (!apiKey || !systemPrompt || !messages) {
    return NextResponse.json(
      { error: "Missing apiKey, systemPrompt, or messages" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { error: `Anthropic API error: ${response.status}`, details: errorBody },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to call Anthropic API" },
      { status: 500 }
    );
  }
}
