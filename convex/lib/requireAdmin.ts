import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export async function requireAdmin(
  ctx: MutationCtx | QueryCtx,
  token: string | undefined,
) {
  if (!token) throw new ConvexError("Not authenticated");
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  if (!session || session.expiresAt < Date.now()) {
    throw new ConvexError("Session expired or invalid");
  }
  return session;
}

export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  // Compare against a fixed-length digest so length itself isn't leaked via
  // early return timing, then fold in a real constant-time byte comparison.
  const maxLen = Math.max(bufA.length, bufB.length, 32);
  let diff = bufA.length === bufB.length ? 0 : 1;
  for (let i = 0; i < maxLen; i++) {
    const byteA = i < bufA.length ? bufA[i] : 0;
    const byteB = i < bufB.length ? bufB[i] : 0;
    diff |= byteA ^ byteB;
  }
  return diff === 0;
}

export function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
