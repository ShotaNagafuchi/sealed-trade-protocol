import { NextRequest, NextResponse } from "next/server";

const MAX_SYSTEM_PROMPT_LENGTH = 5000;
const MAX_MESSAGES = 30;
const MAX_MESSAGE_CONTENT_LENGTH = 2000;

export async function POST(request: NextRequest) {
  // Origin check — only allow requests from same origin
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const apiKey = body.apiKey as string;
  const systemPrompt = body.systemPrompt as string;
  const messages = body.messages as Array<{ role: string; content: string }>;

  if (
    typeof apiKey !== "string" ||
    !apiKey.startsWith("sk-") ||
    typeof systemPrompt !== "string" ||
    !Array.isArray(messages)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Bound input sizes
  if (systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH) {
    return NextResponse.json({ error: "System prompt too long" }, { status: 400 });
  }
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: "Too many messages" }, { status: 400 });
  }

  // Validate and sanitize messages
  const sanitizedMessages = messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: typeof m.content === "string" ? m.content.slice(0, MAX_MESSAGE_CONTENT_LENGTH) : "",
  }));

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
        messages: sanitizedMessages,
      }),
    });

    if (!response.ok) {
      // Don't leak upstream error details to client
      return NextResponse.json(
        { error: "Agent request failed", code: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to call AI agent" },
      { status: 500 }
    );
  }
}
