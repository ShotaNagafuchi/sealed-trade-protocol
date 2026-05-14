import { NextRequest, NextResponse } from "next/server";
import type { NegotiationMessage } from "@/lib/negotiation";

const store = new Map<string, NegotiationMessage[]>();
const TRADE_ID_RE = /^0x[0-9a-f]{64}$/i;
const MAX_MESSAGES_PER_TRADE = 50;
const MAX_TRADES = 200;

function validateTradeId(id: string): boolean {
  return TRADE_ID_RE.test(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  const { tradeId } = await params;
  if (!validateTradeId(tradeId)) {
    return NextResponse.json({ error: "Invalid tradeId" }, { status: 400 });
  }

  const messages = store.get(tradeId) ?? [];
  const after = request.nextUrl.searchParams.get("after");

  if (after) {
    const ts = Number(after);
    if (!Number.isFinite(ts) || ts < 0) {
      return NextResponse.json({ error: "Invalid after parameter" }, { status: 400 });
    }
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
  if (!validateTradeId(tradeId)) {
    return NextResponse.json({ error: "Invalid tradeId" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const role = body.role as string;
  const action = body.action as string;
  const proposedPrice = body.proposedPrice as number;
  const terms = body.terms as string;
  const reasoning = body.reasoning as string;
  const id = body.id as string;

  if (
    !["seller", "buyer"].includes(role) ||
    !["propose", "counter", "accept", "reject"].includes(action) ||
    typeof proposedPrice !== "number" ||
    !Number.isFinite(proposedPrice) ||
    proposedPrice < 0 ||
    typeof terms !== "string" ||
    terms.length > 500
  ) {
    return NextResponse.json({ error: "Invalid message fields" }, { status: 400 });
  }

  const messages = store.get(tradeId) ?? [];

  if (messages.length >= MAX_MESSAGES_PER_TRADE) {
    return NextResponse.json({ error: "Round limit reached" }, { status: 429 });
  }

  if (!store.has(tradeId) && store.size >= MAX_TRADES) {
    return NextResponse.json({ error: "Too many active negotiations" }, { status: 429 });
  }

  const round = messages.length + 1;
  const message: NegotiationMessage = {
    id: typeof id === "string" ? id.slice(0, 64) : crypto.randomUUID(),
    round,
    role: role as "seller" | "buyer",
    action: action as NegotiationMessage["action"],
    proposedPrice,
    terms: terms.slice(0, 500),
    reasoning: typeof reasoning === "string" ? reasoning.slice(0, 500) : "",
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
  if (!validateTradeId(tradeId)) {
    return NextResponse.json({ error: "Invalid tradeId" }, { status: 400 });
  }
  store.delete(tradeId);
  return NextResponse.json({ ok: true });
}
