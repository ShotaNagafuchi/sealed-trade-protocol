import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyWalletAuth } from "@/lib/auth";

function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

// POST /api/keys — generate new API key
export async function POST(request: NextRequest) {
  const address = await verifyWalletAuth(request);
  if (!address) {
    return json({ success: false, error: "Unauthorized — wallet signature required" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON" }, 400);
  }

  const label = typeof body.label === "string" ? body.label.slice(0, 100) : "default";

  const existing = await prisma.apiKey.count({
    where: { walletAddress: { equals: address, mode: "insensitive" }, revokedAt: null },
  });
  if (existing >= 5) {
    return json({ success: false, error: "Maximum 5 active API keys per wallet" }, 400);
  }

  const rawKey = `stp_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.create({
    data: {
      walletAddress: address,
      keyHash,
      label,
    },
  });

  return json({
    success: true,
    data: {
      id: apiKey.id,
      key: rawKey,
      label: apiKey.label,
      createdAt: apiKey.createdAt.toISOString(),
      warning: "Store this key securely. It will not be shown again.",
    },
  }, 201);
}

// GET /api/keys — list your API keys
export async function GET(request: NextRequest) {
  const address = await verifyWalletAuth(request);
  if (!address) {
    return json({ success: false, error: "Unauthorized — wallet signature required" }, 401);
  }

  const keys = await prisma.apiKey.findMany({
    where: { walletAddress: { equals: address, mode: "insensitive" }, revokedAt: null },
    select: { id: true, label: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return json({
    success: true,
    data: keys.map((k) => ({
      ...k,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    })),
  });
}
