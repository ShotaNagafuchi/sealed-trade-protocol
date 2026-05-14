import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { Category } from "@/generated/prisma/enums";

function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

function serializeListing(l: {
  id: string;
  tradeId: string;
  assetHash: string;
  sellerAddress: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  maxDealValue: bigint;
  deadline: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...l,
    maxDealValue: l.maxDealValue.toString(),
    deadline: l.deadline.toISOString(),
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

async function findListing(id: string) {
  // Try by tradeId first (0x...), then by DB id
  if (/^0x[0-9a-fA-F]{64}$/.test(id)) {
    return prisma.listing.findUnique({ where: { tradeId: id } });
  }
  return prisma.listing.findUnique({ where: { id } });
}

// GET /api/listings/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = await findListing(id);
  if (!listing) {
    return json({ success: false, error: "Listing not found" }, 404);
  }
  return json({ success: true, data: serializeListing(listing) });
}

// PATCH /api/listings/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authenticateRequest(request);
  if (!auth) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  const listing = await findListing(id);
  if (!listing) {
    return json({ success: false, error: "Listing not found" }, 404);
  }

  if (listing.sellerAddress.toLowerCase() !== auth.address.toLowerCase()) {
    return json({ success: false, error: "Forbidden" }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON" }, 400);
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.length <= 200) updates.title = body.title;
  if (typeof body.description === "string" && body.description.length <= 10_000) updates.description = body.description;
  if (typeof body.category === "string" && Object.values(Category).includes(body.category as Category)) {
    updates.category = body.category;
  }
  if (Array.isArray(body.tags)) {
    updates.tags = (body.tags as unknown[])
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim().slice(0, 50))
      .filter((t) => t.length > 0)
      .slice(0, 10);
  }

  if (Object.keys(updates).length === 0) {
    return json({ success: false, error: "No valid fields to update" }, 400);
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: updates,
  });

  return json({ success: true, data: serializeListing(updated) });
}

// DELETE /api/listings/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authenticateRequest(request);
  if (!auth) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  const listing = await findListing(id);
  if (!listing) {
    return json({ success: false, error: "Listing not found" }, 404);
  }

  if (listing.sellerAddress.toLowerCase() !== auth.address.toLowerCase()) {
    return json({ success: false, error: "Forbidden" }, 403);
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: { status: "CANCELLED" },
  });

  return json({ success: true, data: serializeListing(updated) });
}
