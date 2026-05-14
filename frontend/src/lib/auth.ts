import { verifyMessage } from "viem";
import { createHash } from "crypto";
import { prisma } from "./prisma";

export type AuthResult =
  | { type: "wallet"; address: string }
  | { type: "apikey"; address: string }
  | null;

// H-2: Replay protection — track used signatures (in-memory, single-instance)
const usedSignatures = new Map<string, number>();

function consumeSignature(sig: string): boolean {
  const now = Date.now();
  // Lazy cleanup of expired entries
  for (const [k, exp] of usedSignatures) {
    if (exp < now) usedSignatures.delete(k);
  }
  if (usedSignatures.has(sig)) return false;
  usedSignatures.set(sig, now + 5 * 60 * 1000);
  return true;
}

/**
 * Verify wallet signature from request headers.
 * Message format: "Sealed Trade: <action> as <address> at <timestamp>"
 */
export async function verifyWalletAuth(
  request: Request
): Promise<string | null> {
  const signature = request.headers.get("X-Signature") as `0x${string}` | null;
  const message = request.headers.get("X-Message");
  if (!signature || !message) return null;

  // Strict prefix check
  if (!message.startsWith("Sealed Trade: ")) return null;

  const timestampMatch = message.match(/at (\d+)$/);
  if (!timestampMatch) return null;
  const timestamp = parseInt(timestampMatch[1], 10);
  if (Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) return null;

  const addressMatch = message.match(/as (0x[0-9a-fA-F]{40})/);
  if (!addressMatch) return null;

  // H-2: Prevent replay
  if (!consumeSignature(signature)) return null;

  try {
    const valid = await verifyMessage({
      address: addressMatch[1] as `0x${string}`,
      message,
      signature,
    });
    return valid ? addressMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Authenticate via API key (X-API-Key header) or wallet signature.
 * SHA-256 is acceptable here because keys are 256-bit random values.
 */
export async function authenticateRequest(
  request: Request
): Promise<AuthResult> {
  // Check API key first
  const apiKey = request.headers.get("X-API-Key");
  if (apiKey) {
    const keyHash = createHash("sha256").update(apiKey).digest("hex");
    const record = await prisma.apiKey.findUnique({ where: { keyHash } });
    if (record && !record.revokedAt) {
      await prisma.apiKey.update({
        where: { id: record.id },
        data: { lastUsedAt: new Date() },
      });
      return { type: "apikey", address: record.walletAddress };
    }
    return null;
  }

  // Check wallet signature
  const address = await verifyWalletAuth(request);
  if (address) {
    return { type: "wallet", address };
  }

  return null;
}
