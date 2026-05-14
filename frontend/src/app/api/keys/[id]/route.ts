import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWalletAuth } from "@/lib/auth";

function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

// DELETE /api/keys/[id] — revoke an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const address = await verifyWalletAuth(request);
  if (!address) {
    return json({ success: false, error: "Unauthorized — wallet signature required" }, 401);
  }

  const apiKey = await prisma.apiKey.findUnique({ where: { id } });
  if (!apiKey) {
    return json({ success: false, error: "API key not found" }, 404);
  }

  if (apiKey.walletAddress.toLowerCase() !== address.toLowerCase()) {
    return json({ success: false, error: "Forbidden" }, 403);
  }

  await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return json({ success: true });
}
