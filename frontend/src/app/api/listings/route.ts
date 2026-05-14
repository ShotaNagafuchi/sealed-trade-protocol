import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { Category, ListingStatus } from "@/generated/prisma/enums";

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

function parseBigInt(value: string, fieldName: string): bigint | string {
  if (!/^\d+$/.test(value)) return `${fieldName} must be a non-negative integer`;
  return BigInt(value);
}

function cleanTags(raw: unknown[]): string[] {
  return raw
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim().slice(0, 50))
    .filter((t) => t.length > 0)
    .slice(0, 10);
}

const VALID_STATUSES = Object.values(ListingStatus);

// GET /api/listings — public search
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const q = url.searchParams.get("q") || "";
  const category = url.searchParams.get("category");
  const tags = url.searchParams.get("tags");
  const minPrice = url.searchParams.get("minPrice");
  const maxPrice = url.searchParams.get("maxPrice");
  const seller = url.searchParams.get("seller");
  const status = url.searchParams.get("status") || "ACTIVE";
  const sort = url.searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

  const where: Prisma.ListingWhereInput = {};

  // M-2: Validate status enum
  if (status && VALID_STATUSES.includes(status as ListingStatus)) {
    where.status = status as ListingStatus;
  } else if (status) {
    return json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, 400);
  }

  if (category && Object.values(Category).includes(category as Category)) {
    where.category = category as Category;
  }
  if (seller) where.sellerAddress = { equals: seller, mode: "insensitive" };

  // H-1: Validate BigInt params
  if (minPrice) {
    const parsed = parseBigInt(minPrice, "minPrice");
    if (typeof parsed === "string") return json({ success: false, error: parsed }, 400);
    where.maxDealValue = { ...(where.maxDealValue as Prisma.BigIntFilter || {}), gte: parsed };
  }
  if (maxPrice) {
    const parsed = parseBigInt(maxPrice, "maxPrice");
    if (typeof parsed === "string") return json({ success: false, error: parsed }, 400);
    where.maxDealValue = { ...(where.maxDealValue as Prisma.BigIntFilter || {}), lte: parsed };
  }

  if (tags) {
    where.tags = { hasSome: tags.split(",").map((t) => t.trim()).filter(Boolean) };
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    sort === "price_asc"
      ? { maxDealValue: "asc" }
      : sort === "price_desc"
        ? { maxDealValue: "desc" }
        : { createdAt: "desc" };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  return json({
    success: true,
    data: listings.map(serializeListing),
    meta: { total, page, limit },
  });
}

// POST /api/listings — create listing (authenticated)
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON" }, 400);
  }

  const { tradeId, assetHash, title, description, category, tags, maxDealValue, deadline } = body as {
    tradeId?: string;
    assetHash?: string;
    title?: string;
    description?: string;
    category?: string;
    tags?: unknown[];
    maxDealValue?: string;
    deadline?: string;
  };

  if (!tradeId || !assetHash || !title || !description || !category || !maxDealValue || !deadline) {
    return json({ success: false, error: "Missing required fields: tradeId, assetHash, title, description, category, maxDealValue, deadline" }, 400);
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(tradeId)) {
    return json({ success: false, error: "Invalid tradeId format" }, 400);
  }

  // H-3: Validate assetHash format
  if (!/^0x[0-9a-fA-F]{64}$/.test(assetHash)) {
    return json({ success: false, error: "Invalid assetHash: must be 0x-prefixed 32-byte hex" }, 400);
  }

  if (!Object.values(Category).includes(category as Category)) {
    return json({ success: false, error: `Invalid category. Must be one of: ${Object.values(Category).join(", ")}` }, 400);
  }

  if (title.length > 200) {
    return json({ success: false, error: "Title must be 200 characters or less" }, 400);
  }

  // L-2: Cap description length
  if (description.length > 10_000) {
    return json({ success: false, error: "Description must be 10,000 characters or less" }, 400);
  }

  // H-1: Validate BigInt
  const parsedValue = parseBigInt(maxDealValue, "maxDealValue");
  if (typeof parsedValue === "string") return json({ success: false, error: parsedValue }, 400);

  // H-3: Validate deadline
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return json({ success: false, error: "Invalid deadline: must be ISO 8601 date string" }, 400);
  }

  const existing = await prisma.listing.findUnique({ where: { tradeId } });
  if (existing) {
    return json({ success: false, error: "Listing already exists for this tradeId" }, 409);
  }

  const listing = await prisma.listing.create({
    data: {
      tradeId,
      assetHash,
      sellerAddress: auth.address,
      title,
      description,
      category: category as Category,
      tags: Array.isArray(tags) ? cleanTags(tags) : [],
      maxDealValue: parsedValue,
      deadline: deadlineDate,
    },
  });

  return json({ success: true, data: serializeListing(listing) }, 201);
}
