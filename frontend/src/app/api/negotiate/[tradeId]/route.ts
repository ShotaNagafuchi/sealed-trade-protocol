import { NextRequest, NextResponse } from "next/server";
import type { NegotiationMessage } from "@/lib/negotiation";

const store = new Map<string, NegotiationMessage[]>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  const { tradeId } = await params;
  const after = request.nextUrl.searchParams.get("after");
  const messages = store.get(tradeId) ?? [];

  if (after) {
    const ts = Number(after);
    return NextResponse.json({
      messages: messages.filter((m) => m.timestamp > ts),
    });
  }

  return NextResponse.json({ messages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  const { tradeId } = await params;
  const body = (await request.json()) as Omit<NegotiationMessage, "round">;

  if (!body.role || !body.action || body.proposedPrice == null || !body.terms) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const messages = store.get(tradeId) ?? [];
  const round = messages.length + 1;

  const message: NegotiationMessage = {
    ...body,
    round,
    timestamp: Date.now(),
  };

  messages.push(message);
  store.set(tradeId, messages);

  return NextResponse.json({ ok: true, messageCount: messages.length });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  const { tradeId } = await params;
  store.delete(tradeId);
  return NextResponse.json({ ok: true });
}
